import mongoose, { Schema, InferSchemaType } from 'mongoose'

export type CreativeStatus = 'minted' | 'pending' | 'failed'

const CreativeSchema = new Schema(
  {
    // pre-watermark hash
    originalHash: {
      type: String,
      required: true,
      index: true,
      match: /^0x[a-fA-F0-9]{64}$/
    },
    // post-watermark hash (used on-chain as published hash)
    publishedHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^0x[a-fA-F0-9]{64}$/
    },
    tokenId: { type: String },
    owner: { type: String, required: true, index: true },
    contractAddress: { type: String, required: true, index: true },
    chainId: { type: Number, default: undefined, index: true },
    tokenURI: { type: String, required: true },
    fileUrl: { type: String, required: true },
    metadataUrl: { type: String, required: true },
    transactionHash: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['minted', 'pending', 'failed'],
      required: true,
      default: 'pending',
      index: true
    },
    // ERC-4907 leasing fields
    user: { type: String, index: true, default: undefined },
    userExpires: { type: Number, index: true, default: 0 },
    // Optional: keep a history of leases
    leaseHistory: {
      type: [
        new Schema(
          {
            user: { type: String, required: true, index: true },
            expires: { type: Number, required: true },
            transactionHash: { type: String, required: true, index: true },
            createdAt: { type: Date, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
)

export type CreativeDocument = InferSchemaType<typeof CreativeSchema>
export const CreativeModel = mongoose.model<CreativeDocument>('Creative', CreativeSchema)


