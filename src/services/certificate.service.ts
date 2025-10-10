import { createHash } from 'crypto'
import { uploadMetadataToCloudinary, uploadToCloudinary } from '~/helpers/cloudinary'
import { BadRequestError } from '~/ultis/CustomErrors'
import { addWatermark } from '~/ultis/Watermark'
import { ethers } from 'ethers'
import { contractCertificateSBT } from '~/contracts/ABI/CertificateSBT'

type MintParams = {
  owner: string
  file: Express.Multer.File
}

export const mintCertificateService = async ({ owner, file }: MintParams) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  // 0) xác định loại file (ảnh / PDF)
  const isImage = file.mimetype.startsWith('image/')
  const resourceType = isImage ? 'image' : 'raw'

  // 1) hash file (SHA256)
  const fileHashHex = createHash('sha256').update(file.buffer).digest('hex')
  const fileHashBytes32 = '0x' + fileHashHex

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
    pdf: animationUrl,
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

  let receipt
  try {
    const tx = await contract.mintCertificate(owner, fileHashBytes32, metadataUrl)
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

  return {
    tokenId,
    hash: fileHashBytes32,
    tokenURI: metadataUrl,
    transactionHash: receipt.transactionHash,
    qrUrl: '',
    qrImage: ''
  }
}
