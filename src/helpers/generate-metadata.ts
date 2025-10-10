export const generateERC721Metadata = (params: {
  name: string
  description: string
  image?: string
  animation_url?: string
  attributes?: Array<{ trait_type: string; value: string }>
  external_url?: string
}) => {
  return {
    name: params.name,
    description: params.description,
    image: params.image,
    animation_url: params.animation_url,
    attributes: params.attributes || [],
    external_url: params.external_url
  }
}