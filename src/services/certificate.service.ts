import { createHash } from 'crypto'
import { uploadMetadataToCloudinary, uploadToCloudinary } from '~/helpers/cloudinary'
import { BadRequestError, NotFoundError } from '~/ultis/CustomErrors'
import { addWatermark } from '~/ultis/Watermark'
import { ethers, TransactionReceipt } from 'ethers'
import { contractCertificateSBT } from '~/contracts/ABI/CertificateSBT'
import { CertificateModel } from '~/models/schemas/Certificate'
import type { EthersError } from 'ethers'

export const mintCertificateService = async ({ owner, file }: { owner: string; file: Express.Multer.File }) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  const x = ethers.getAddress(owner.toLowerCase())
  if(x !== owner){
    throw new BadRequestError('Owner address is not valid')
  }

  // 0) xác định loại file (ảnh / PDF)
  const isImage = file.mimetype.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'

  // 1) hash file (SHA256)
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = ('0x' + fileHashHex) as `0x${string}`

  // 2) Watermark + hash file + lưu file vào public/uploads
  const watermarkedBuffer = await addWatermark(file.buffer, file.mimetype)
  const watermarkedFileHashHex = createHash('sha256')
    .update(watermarkedBuffer as Buffer)
    .digest('hex')
  const watermarkedFileHashBytes32 = ('0x' + watermarkedFileHashHex) as `0x${string}`

  // 3) Upload Cloudinary
  const [fileUrl] = await Promise.all([
    uploadToCloudinary(watermarkedBuffer as Buffer, 'certificates', resourceType, watermarkedFileHashBytes32)
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
      { trait_type: 'fileHash', value: watermarkedFileHashBytes32 },
      { trait_type: 'type', value: 'certificate' }
    ],
    // Sau này làm trang verify thì thêm vào
    external_url: ''
  }

  // 5) Upload metadata JSON vào Cloudinary
  const metadataUrl = await uploadMetadataToCloudinary(metadata, 'metadata', watermarkedFileHashHex)

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
      contract.mintCertificate(owner, watermarkedFileHashBytes32, metadataUrl),
      CertificateModel.findOneAndUpdate(
        { publishedHash: watermarkedFileHashBytes32 },
        {
          $set: {
            publishedHash: watermarkedFileHashBytes32,
            originalHash: fileHashBytes32,
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
    const e = err as EthersError

    if (e.code === 'INVALID_ARGUMENT' && e.message === 'address') {
      throw new BadRequestError('Onwner address is not exists')
    }

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
      publishedHash: watermarkedFileHashBytes32
    },
    {
      originalHash: fileHashBytes32,
      publishedHash: watermarkedFileHashBytes32,
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
    publishedHash: watermarkedFileHashBytes32,
    originalHash: fileHashBytes32,
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

  let cert = await CertificateModel.findOne({
    $or: [{ publishedHash: fileHashBytes32 }, { originalHash: fileHashBytes32 }]
  })
    .select('tokenId publishedHash originalHash')
    .lean()

  if (!cert) throw new NotFoundError('Certificate not found in database')

  // Nếu chưa có tokenId trong request, lấy từ DB
  if (!tokenId && cert.tokenId) {
    tokenId = Number(cert.tokenId)
  }
  if (!tokenId) {
    throw new BadRequestError('Missing tokenId for verification')
  }

  // 2) Kiểm tra fileHashBytes32 có khớp với hash trong contract không
  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY
  const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(privateKey as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCertificateSBT, signer)

  // nếu fileHashBytes32 khớp với originalHash thì sử dụng publishedHash, nếu không thì sử dụng originalHash
  const publishedHash = fileHashBytes32 === cert?.publishedHash ? fileHashBytes32 : cert?.publishedHash
  const typeHash = fileHashBytes32 === cert?.originalHash ? 'original' : 'published'

  let onChainMatch = false
  try {
    onChainMatch = await contract.verifyHash(tokenId, publishedHash)
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
    typeHash,
    onChainMatch,
    tokenURI
  }
}
