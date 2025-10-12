export const USERS_MESSAGES = {
  //mint token for certificate
  OWNER_IS_REQUIRED: 'Owner is required',
  OWNER_IS_NOT_VALID: 'Owner is not valid',

  TOKEN_ID_IS_REQUIRED: 'Token ID is required',
  TOKEN_ID_IS_NOT_VALID: 'Token ID must be an integer',

  CONTRACT_ADDRESS_IS_REQUIRED: 'Contract address is required',
  CONTRACT_ADDRESS_IS_NOT_VALID: 'Contract address is not valid',

  CHAIN_ID_IS_REQUIRED: 'Chain ID is required',
  CHAIN_ID_IS_NOT_VALID: 'Chain ID must be an integer',

  TYPE_IS_REQUIRED: 'Type is required',
  TYPE_IS_NOT_VALID: 'Type must be a string',

  SIG_IS_REQUIRED: 'Signature is required',
  SIG_IS_NOT_VALID: 'Signature must be a string',
} as const
