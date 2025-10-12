export interface mintCertificateReqBody {
  owner: string
}

export interface verifyCertificateReqBody {
  tokenId: number
}

export interface verifyCertificateReqQuery {
  tokenId: number
  contractAddress: string
  chainId: number
  type?: string
  sig?: string
}