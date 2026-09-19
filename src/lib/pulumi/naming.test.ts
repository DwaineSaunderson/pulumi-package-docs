import { describe, expect, it } from 'vitest'

import { formatPropertyName } from '@/lib/pulumi/naming'

describe('formatPropertyName', () => {
  it('leaves the name as-is when no runtime is given', () => {
    expect(formatPropertyName('bucketName')).toBe('bucketName')
  })

  it('leaves the name as-is for nodejs, java, and yaml', () => {
    expect(formatPropertyName('bucketName', 'nodejs')).toBe('bucketName')
    expect(formatPropertyName('bucketName', 'java')).toBe('bucketName')
    expect(formatPropertyName('bucketName', 'yaml')).toBe('bucketName')
  })

  it('converts to snake_case for python', () => {
    expect(formatPropertyName('bucketName', 'python')).toBe('bucket_name')
    expect(formatPropertyName('s3BucketName', 'python')).toBe('s3_bucket_name')
    expect(formatPropertyName('id', 'python')).toBe('id')
  })

  it('converts to PascalCase for go and dotnet', () => {
    expect(formatPropertyName('bucketName', 'go')).toBe('BucketName')
    expect(formatPropertyName('bucketName', 'dotnet')).toBe('BucketName')
    expect(formatPropertyName('s3BucketName', 'go')).toBe('S3BucketName')
  })
})
