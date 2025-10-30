import { createHash } from "crypto";
import { ethers, EthersError, TransactionReceipt } from "ethers";
import { contractCreativeAsset4907 } from "~/contracts/ABI/CreativeAsset4907";
import { uploadMetadataToCloudinary, uploadToCloudinary } from "~/helpers/cloudinary";
import { CreativeModel } from "~/models/schemas/Creative";
import { BadRequestError } from "~/ultis/CustomErrors";
import { addWatermark } from "~/ultis/Watermark";

export const mintCreativeService = async ({
  owner,
  issuerName,
  title,
  description,
  file
}: {
  owner: string
  issuerName: string
  title?: string
  description?: string
  file: Express.Multer.File
}) => {
  if (file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new BadRequestError('File type not supported')
  }

  if(!ethers.isAddress(owner)) {
    throw new BadRequestError('Owner address is not valid')
  }
  const ownerChecksum = ethers.getAddress(owner)

  const rpcUrl = process.env.RPC_URL
  const privateKey = process.env.PRIVATE_KEY
  const contractAddress = process.env.CREATIVE4907_CONTRACT_ADDRESS

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCreativeAsset4907, wallet)

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
    // pass publishedHashHex (no 0x) for public_id
    uploadToCloudinary(watermarkedBuffer as Buffer, 'creatives', resourceType, watermarkedFileHashHex)
  ])

  // 4) Tạo metadata JSON
  const imageUrl = isImage ? fileUrl : undefined
  const animationUrl = !isImage ? fileUrl : undefined

    const metadata = {
      name: (title?.trim() || 'Creative'),
      description: (description?.trim() || 'Creative'),
      image: imageUrl,
      animation_url: animationUrl,
      attributes: [
        { trait_type: 'issuerName', value: issuerName },
        { trait_type: 'issuerWallet', value: wallet.address },
        { trait_type: 'issueDate', value: new Date().toISOString() },
        { trait_type: 'fileHash', value: watermarkedFileHashBytes32 },
        { trait_type: 'type', value: 'creative' }
      ],
    // Sau này làm trang verify thì thêm vào
    external_url: ''
  }

  // 5) Upload metadata JSON vào Cloudinary
  const metadataUrl = await uploadMetadataToCloudinary(metadata, 'metadata', watermarkedFileHashHex)

   let receipt: TransactionReceipt
  try {
    const fee = await provider.getFeeData()
    const gasEstimate = await contract.mintAsset.estimateGas(ownerChecksum, metadataUrl, watermarkedFileHashBytes32)

    const gasLimit = gasEstimate + (gasEstimate / 5n) // 20%
    const maxFeePerGas = fee.maxFeePerGas ?? fee.gasPrice ?? 0n // trường hợp nếu mạng không hỗ trợ EIP-1559, fallback sang gasPrice.
    const required = maxFeePerGas * gasLimit

    const balance = await provider.getBalance(wallet.address)
    if (balance < required) {
      throw new BadRequestError('Insufficient balance!')
    }

    const [tx] = await Promise.all([
      contract.mintAsset(ownerChecksum, metadataUrl, watermarkedFileHashBytes32,{
        gasLimit: gasLimit,
        maxFeePerGas: fee.maxFeePerGas ?? fee.gasPrice,
        maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? 0n 
      }),
      CreativeModel.findOneAndUpdate(
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
      throw new BadRequestError('Owner address does not exist')
    }

    throw new BadRequestError('Minting creative failed!')
  }

  let tokenId: string | undefined
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log)

      if (parsed?.name === 'AssetMinted') {
        tokenId = parsed?.args?.tokenId.toString()
      }
    } catch (err) {
      // Bỏ qua log không khớp với ABI
    }
  }

  await CreativeModel.updateOne(
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

  // const chainId = Number(process.env.CHAIN_ID || 11155111)
  // const qrBase =
  //   process.env.VERIFY_BASE_URL +
  //   `?tokenId=${tokenId}&contractAddress=${contractAddress}&chainId=${chainId}&type=${'SBT'}`
  // const qrUrl = `${qrBase}?tokenId=${tokenId}&contract=${contractAddress}&chain=${chainId}&type=sbt`
  // const qrImage = await QRCode.toDataURL(qrUrl)

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

export const leaseCreativeService = async ({ tokenId, user, expires }: { tokenId: string; user: string; expires: number }) => {  
  const rpcUrl = process.env.RPC_URL
  const contractAddress = process.env.CREATIVE4907_CONTRACT_ADDRESS
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider)
  const contract = new ethers.Contract(contractAddress as string, contractCreativeAsset4907, wallet)

  // chỉ có owner mới có thể lease
  const onChainOwner = await contract.ownerOf(Number(tokenId))
  if(ethers.getAddress(onChainOwner) !== ethers.getAddress(wallet.address)) {
    throw new BadRequestError('You are not the owner of this creative')
  }

  const userChecksum = ethers.getAddress(user)
  const expiresNum = Number(expires)
  const fee = await provider.getFeeData()
  const gasEstimate = await contract.setUser.estimateGas(Number(tokenId), userChecksum, expiresNum)
   const gasLimit = gasEstimate + (gasEstimate / 5n) // 20%

  const tx = await contract.setUser(Number(tokenId), userChecksum, expiresNum, {
     gasLimit: gasLimit,
     maxFeePerGas: fee.maxFeePerGas ?? fee.gasPrice,
     maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? 0n
   })
  const receipt = await tx.wait()

  const [userOf, userExpires, tokenURI] = await Promise.all([
    contract.userOf(Number(tokenId)),
    contract.userExpires(Number(tokenId)),
    contract.tokenURI(Number(tokenId))
  ])

  const chainId = Number(process.env.CHAIN_ID || 11155111)
  await CreativeModel.findOneAndUpdate(
    { tokenId: String(tokenId), contractAddress, chainId },
    {
      $set: {
        owner: ethers.getAddress(onChainOwner),
        user: userOf === ethers.ZeroAddress ? undefined : ethers.getAddress(userOf),
        userExpires: Number(userExpires),
        tokenURI,
        transactionHash: receipt.hash
      },
      $push: {
        leaseHistory: {
          user: ethers.getAddress(user),
          expires: Number(userExpires),
          transactionHash: receipt.hash
        }
      }
    },
    { upsert: true }
  )

  return {
    tokenId,
    contractAddress,
    chainId,
    owner: ethers.getAddress(onChainOwner),
    user: userOf === ethers.ZeroAddress ? undefined : ethers.getAddress(userOf),
    expires: Number(userExpires),
    tokenURI,
    transactionHash: receipt.hash,
    status: 'leased'
  }
}

export const getCreativeByOwnerAddressService = async ({ ownerAddress, page, limit }: { ownerAddress: string; page: number; limit: number }) => {
  if (!ethers.isAddress(ownerAddress)) {
    throw new BadRequestError('Owner address is not valid')
  }
  const ownerChecksum = ethers.getAddress(ownerAddress)

  const filter = { owner: ownerChecksum, status: 'minted' }
  const safePage = Number.isFinite(page) && page > 0 ? page : 1
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10
  const [total, items] = await Promise.all([
    await CreativeModel.countDocuments(filter),
    await CreativeModel.find(filter)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .sort({ createdAt: -1 })
      .lean()
  ])

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 1
    }
  }
}