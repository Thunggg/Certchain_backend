import mongoose, { Schema, InferSchemaType, Model } from 'mongoose'
export type CertificateStatus = 'minted' | 'pending' | 'failed'

const CertificateSchema = new Schema(
  {
    fileHash: {
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
    }
  },
  { timestamps: true }
)

export type CertificateDocument = InferSchemaType<typeof CertificateSchema>
export const CertificateModel = mongoose.model<CertificateDocument>('Certificate', CertificateSchema)
