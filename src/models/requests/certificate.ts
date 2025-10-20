import { ParsedQs } from 'qs'

export interface mintCertificateReqBody {
  owner: string
}

export interface verifyCertificateReqBody {
  tokenId: number
}

export interface verifyCertificateReqQuery extends ParsedQs{
  tokenId: string
  contractAddress: string
  chainId: string
  type?: string
  sig?: string
}

export interface getCertificateByOwnerAddressReqQuery{
  ownerAddress: string
  page?: number
  limit?: number
}