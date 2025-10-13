import { createHash } from 'crypto'
import { uploadMetadataToCloudinary, uploadToCloudinary } from '~/helpers/cloudinary'
import { BadRequestError, BlockchainError, NotFoundError } from '~/ultis/CustomErrors'
import { addWatermark } from '~/ultis/Watermark'
import { ethers, TransactionReceipt } from 'ethers'
import { contractCertificateSBT } from '~/contracts/ABI/CertificateSBT'
import { CertificateModel } from '~/models/schemas/Certificate'
import type { EthersError } from 'ethers'
import QRCode from 'qrcode'

export const mintCertificateService = async ({ owner, file }: { owner: string; file: Express.Multer.File }) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  if (!ethers.isAddress(owner)) {
    throw new BadRequestError('Owner address is not valid')
  }
  const ownerChecksum = ethers.getAddress(owner)

  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY
  const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCertificateSBT, wallet)

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
      { trait_type: 'issuerWallet', value: wallet.address as string },
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
  // const rpcUrl = process.env.RPC_URL
  // const privateKey = process.env.PRIVATE_KEY
  // const contractAddress = process.env.CERTIFICATE_CONTRACT_ADDRESS

  // const provider = new ethers.JsonRpcProvider(rpcUrl)
  // const wallet = new ethers.Wallet(privateKey as string, provider)
  // const contract = new ethers.Contract(contractAddress as string, contractCertificateSBT, wallet)

  let receipt: TransactionReceipt
  try {
    const fee = await provider.getFeeData()
    const gasEstimate = await contract.mintCertificate.estimateGas(
      ownerChecksum,
      watermarkedFileHashBytes32,
      metadataUrl
    )

    const gasLimit = gasEstimate + gasEstimate / 5n // 20%
    const maxFeePerGas = fee.maxFeePerGas ?? fee.gasPrice ?? 0n // trường hợp nếu mạng không hỗ trợ EIP-1559, fallback sang gasPrice.
    const required = maxFeePerGas * gasLimit

    const balance = await provider.getBalance(wallet.address)
    if (balance < required) {
      throw new BadRequestError('Insufficient balance!')
    }

    const [tx] = await Promise.all([
      contract.mintCertificate(ownerChecksum, watermarkedFileHashBytes32, metadataUrl, {
        gasLimit: gasLimit,
        maxFeePerGas: fee.maxFeePerGas ?? fee.gasPrice,
        maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? 0n
      }),
      CertificateModel.findOneAndUpdate(
        { publishedHash: watermarkedFileHashBytes32 },
        {
          $set: {
            publishedHash: watermarkedFileHashBytes32,
            originalHash: fileHashBytes32,
            owner: ownerChecksum,
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
      owner: ownerChecksum,
      contractAddress,
      chainId: Number(process.env.CHAIN_ID || 11155111), // sepoliaETH testnet
      tokenURI: metadataUrl,
      fileUrl,
      metadataUrl,
      transactionHash: receipt.hash,
      status: tokenId ? 'minted' : 'failed'
    }
  )

  const chainId = Number(process.env.CHAIN_ID || 11155111)
  const qrBase =
    process.env.VERIFY_BASE_URL +
    `?tokenId=${tokenId}&contractAddress=${contractAddress}&chainId=${chainId}&type=${'SBT'}`
  const qrUrl = `${qrBase}?tokenId=${tokenId}&contract=${contractAddress}&chain=${chainId}&type=sbt`
  const qrImage = await QRCode.toDataURL(qrUrl)

  return {
    tokenId,
    publishedHash: watermarkedFileHashBytes32,
    originalHash: fileHashBytes32,
    tokenURI: metadataUrl,
    transactionHash: receipt.hash,
    qrUrl,
    qrImage
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

export const verifyCertificateByQueryService = async ({
  tokenId,
  contractAddress,
  chainId,
  type
}: {
  tokenId: number
  contractAddress: string
  chainId: number
  type?: string
}) => {
  try {
    if (!ethers.isAddress(contractAddress)) {
      throw new BadRequestError('Contract address is not valid')
    }
    const contractAddressChecksum = ethers.getAddress(contractAddress)

    const rpcUrl = process.env.RPC_URL
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(contractAddressChecksum as string, contractCertificateSBT, provider)

    const [owner, tokenURI] = await Promise.all([contract.ownerOf(tokenId), contract.tokenURI(tokenId)])

    return {
      tokenId,
      contractAddressChecksum,
      chainId,
      owner,
      tokenURI,
      status: 'verified'
    }
  } catch (err: unknown) {
    const e = err as EthersError
    if (e?.code === 'CALL_EXCEPTION') {
      throw new NotFoundError('Token not found')
    }

    if (e?.code === 'NETWORK_ERROR') {
      throw new BlockchainError('Blockchain network error')
    }

    throw new BadRequestError('Verification failed!')
  }
}
