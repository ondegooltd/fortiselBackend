import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({ description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ description: 'Request timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Request ID for tracking', required: false })
  requestId?: string;

  @ApiProperty({ description: 'API version', required: false })
  version?: string;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    requestId?: string,
    version?: string,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.version = version;
  }

  static success<T>(
    data: T,
    message: string = 'Success',
    requestId?: string,
    version?: string,
  ): BaseResponseDto<T> {
    return new BaseResponseDto(true, message, data, requestId, version);
  }

  static error(
    message: string,
    requestId?: string,
    version?: string,
  ): BaseResponseDto {
    return new BaseResponseDto(false, message, undefined, requestId, version);
  }
}

export class PaginatedResponseDto<T = any> extends BaseResponseDto<T[]> {
  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Success',
    requestId?: string,
    version?: string,
  ) {
    super(true, message, data, requestId, version);
    this.pagination = pagination;
  }

  static create<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message: string = 'Success',
    requestId?: string,
    version?: string,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(
      data,
      pagination,
      message,
      requestId,
      version,
    );
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Error code', required: false })
  errorCode?: string;

  @ApiProperty({ description: 'Validation errors', required: false })
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  @ApiProperty({ description: 'Business rule violations', required: false })
  businessRuleViolations?: string[];

  constructor(
    message: string,
    errorCode?: string,
    validationErrors?: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
    businessRuleViolations?: string[],
    requestId?: string,
    version?: string,
  ) {
    super(false, message, undefined, requestId, version);
    this.errorCode = errorCode;
    this.validationErrors = validationErrors;
    this.businessRuleViolations = businessRuleViolations;
  }

  static create(
    message: string,
    errorCode?: string,
    validationErrors?: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
    businessRuleViolations?: string[],
    requestId?: string,
    version?: string,
  ): ErrorResponseDto {
    return new ErrorResponseDto(
      message,
      errorCode,
      validationErrors,
      businessRuleViolations,
      requestId,
      version,
    );
  }
}
