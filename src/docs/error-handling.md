## Error Handling

### Common structure

All errors return the same envelope:

```json
{
  "code": 1000,
  "message": "Bad request",
  "status": 400,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "errors": [{ "field": "owner", "message": "Owner address is not valid", "value": "0x..." }]
}
```

### HTTP codes

- 400 Bad Request: invalid params, invalid address, file type/size not allowed
- 401 Unauthorized: authentication required or token invalid (if applied)
- 403 Forbidden: not permitted (owner-only actions)
- 404 Not Found: token not found / certificate missing
- 409 Conflict: duplicate resource
- 422 Unprocessable Entity: validation errors (schema)
- 502 Bad Gateway: blockchain network errors
- 500 Internal Server Error: unexpected failure

### Domain errors

- BadRequestError → 400
- NotFoundError → 404
- ConflictError → 409
- BlockchainError → 502
- Upload/Watermark/Metadata → 400
