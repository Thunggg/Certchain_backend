
export interface CertificateMetadataInput {
  name: string                 // Tên chứng chỉ hoặc tài sản sáng tạo
  description: string          // Mô tả ngắn gọn
  issuerName: string           // Tên tổ chức cấp
  issuerWallet: string         // Ví tổ chức cấp
  issueDate: string            // Ngày cấp (ISO string)

  fileUrl: string              // URL PDF (Cloudinary / IPFS)
  previewImageUrl: string      // URL ảnh xem trước (thumbnail)

  hash?: string                // Nếu đã tính trước hash (SHA-256)

  type?: 0 | 1 // Loại asset
}

export const generateMetadataJSON  = (data: CertificateMetadataInput) => {

  return {
    name: data.name,
    description: data.description,
    issuerName: data.issuerName,
    issuerWallet: data.issuerWallet,
    issueDate: data.issueDate,
    fileUrl: data.fileUrl,
    previewImageUrl: data.previewImageUrl,
    hash: data.hash,
    type: data.type,
  }
}