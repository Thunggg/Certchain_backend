import { createHash } from 'crypto'
import { uploadMetadataToCloudinary, uploadToCloudinary } from '~/helpers/cloudinary'
import { BadRequestError, NotFoundError } from '~/ultis/CustomErrors'
import { addWatermark } from '~/ultis/Watermark'
import { ethers, TransactionReceipt } from 'ethers'
import { contractCertificateSBT } from '~/contracts/ABI/CertificateSBT'
import { CertificateModel } from '~/models/schemas/Certificate'

export const mintCertificateService = async ({ owner, file }: { owner: string; file: Express.Multer.File }) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  // 0) xác định loại file (ảnh / PDF)
  const isImage = file.mimetype.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'

  // 1) hash file (SHA256)
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = ('0x' + fileHashHex) as `0x${string}`

  // 2) Watermark + lưu file vào public/uploads
  const watermarkedBuffer = await addWatermark(file.buffer, file.mimetype)

  // 3) Upload Cloudinary
  const [fileUrl] = await Promise.all([
    uploadToCloudinary(watermarkedBuffer as Buffer, 'certificates', resourceType, fileHashHex)
  ])

  // 4) Tạo metadata JSON
  const imageUrl = isImage ? fileUrl : undefined
  const animationUrl = !isImage ? fileUrl : undefined

  const metadata = {
    name: 'Certificate',
    description: 'Certificate',
    image: imageUrl,
    animation_url: animationUrl,
    attributes: [
      { trait_type: 'issuerName', value: 'FPT University' },
      { trait_type: 'issuerWallet', value: owner },
      { trait_type: 'issueDate', value: new Date().toISOString() },
      { trait_type: 'fileHash', value: fileHashBytes32 },
      { trait_type: 'type', value: 'certificate' }
    ],
    // Sau này làm trang verify thì thêm vào
    external_url: ''
  }

  // 5) Upload metadata JSON vào Cloudinary
  const metadataUrl = await uploadMetadataToCloudinary(metadata, 'metadata', fileHashHex)

  // 6) mint NFT on-chain
  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY
  const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCertificateSBT, wallet)

  let receipt: TransactionReceipt
  try {
    const [tx] = await Promise.all([
      contract.mintCertificate(owner, fileHashBytes32, metadataUrl),
      CertificateModel.findOneAndUpdate(
        { fileHash: fileHashBytes32 },
        {
          $set: {
            owner,
            contractAddress,
            chainId: Number(process.env.CHAIN_ID || 11155111), // sepoliaETH testnet
            tokenURI: metadataUrl,
            fileUrl,
            metadataUrl,
            transactionHash: '',
            status: 'pending',
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { new: true, upsert: true }
      )
    ])

    receipt = await tx.wait()
  } catch (err) {
    throw new BadRequestError('Minting certificate failed!')
  }

  let tokenId: string | undefined
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log)

      if (parsed?.name === 'CertificateMinted') {
        tokenId = parsed?.args?.tokenId.toString()
      }
    } catch (err) {
      // Bỏ qua log không khớp với ABI
    }
  }

  await CertificateModel.updateOne(
    {
      fileHash: fileHashBytes32
    },
    {
      tokenId,
      owner,
      contractAddress,
      chainId: Number(process.env.CHAIN_ID || 11155111), // sepoliaETH testnet
      tokenURI: metadataUrl,
      fileUrl,
      metadataUrl,
      transactionHash: receipt.hash,
      status: tokenId ? 'minted' : 'failed'
    }
  )

  return {
    tokenId,
    hash: fileHashBytes32,
    tokenURI: metadataUrl,
    transactionHash: receipt.hash,
    qrUrl: '',
    qrImage: ''
  }
}

export const verifyCertificateService = async ({ tokenId, file }: { tokenId: number; file: Express.Multer.File }) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  // 1) Tính SHA256
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = ('0x' + fileHashHex) as `0x${string}`

  if (!tokenId) {
  const cert = await CertificateModel
    .findOne({ fileHash: fileHashBytes32 })
    .select('tokenId')
    .lean()

  if (cert?.tokenId) {
    tokenId = Number(cert.tokenId)
  }
  else{
    throw new NotFoundError('Certificate not found')
  }
}

  // 2) Kiểm tra fileHashBytes32 có khớp với hash trong contract không
  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY
  const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(privateKey as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCertificateSBT, signer)

  let onChainMatch = false
  try {
    onChainMatch = await contract.verifyHash(tokenId, fileHashBytes32)
  } catch (err) {
    throw new BadRequestError('Verification failed!')
  }

  // 3) Đọc tokenURI từ contract
  let tokenURI: string | undefined
  try {
    tokenURI = await contract.tokenURI(tokenId)
  } catch (err) {
    throw new BadRequestError('Verification failed!')
  }

  return {
    tokenId,
    hash: fileHashBytes32,
    onChainMatch,
    tokenURI
  }
}
