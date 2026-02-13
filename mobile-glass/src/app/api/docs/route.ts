import { NextResponse } from 'next/server'

// OpenAPI 3.0 스펙
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: '렌즈초이스 API',
    version: '1.0.0',
    description: '안경렌즈 주문관리 시스템 API 문서',
    contact: {
      name: 'LensChoice Support',
      email: 'support@lenschoice.co.kr'
    }
  },
  servers: [
    { url: '/api', description: 'Production API' }
  ],
  tags: [
    { name: 'Auth', description: '인증 관련' },
    { name: 'Orders', description: '주문 관리' },
    { name: 'Products', description: '상품 관리' },
    { name: 'Stores', description: '거래처 관리' },
    { name: 'Stats', description: '통계/리포트' },
    { name: 'Settings', description: '설정' }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: '로그인',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', description: '사용자 아이디' },
                  password: { type: 'string', description: '비밀번호' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: '로그인 성공' },
          '401': { description: '인증 실패' },
          '429': { description: '요청 제한 초과' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: '현재 사용자 정보',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '사용자 정보' },
          '401': { description: '인증 필요' }
        }
      }
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: '주문 목록 조회',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'pending, confirmed, shipped, delivered, cancelled' },
          { name: 'storeId', in: 'query', schema: { type: 'integer' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': { description: '주문 목록' }
        }
      },
      post: {
        tags: ['Orders'],
        summary: '주문 생성',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['storeId', 'items'],
                properties: {
                  storeId: { type: 'integer' },
                  orderType: { type: 'string', enum: ['stock', 'rx'] },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'integer' },
                        quantity: { type: 'number' },
                        sph: { type: 'string' },
                        cyl: { type: 'string' },
                        axis: { type: 'string' }
                      }
                    }
                  },
                  memo: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: '주문 생성 성공' }
        }
      }
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: '주문 상세 조회',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: '주문 상세' },
          '404': { description: '주문 없음' }
        }
      },
      patch: {
        tags: ['Orders'],
        summary: '주문 수정',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: '수정 성공' }
        }
      }
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: '상품 목록 조회',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'brandId', in: 'query', schema: { type: 'integer' } },
          { name: 'optionType', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: '상품 목록' }
        }
      }
    },
    '/stores': {
      get: {
        tags: ['Stores'],
        summary: '거래처 목록 조회',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: '거래처 목록' }
        }
      },
      post: {
        tags: ['Stores'],
        summary: '거래처 등록',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '등록 성공' }
        }
      }
    },
    '/stores/{id}': {
      get: {
        tags: ['Stores'],
        summary: '거래처 상세 조회',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: '거래처 상세' }
        }
      }
    },
    '/dashboard': {
      get: {
        tags: ['Stats'],
        summary: '대시보드 통계',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['7d', '30d', '90d'] } }
        ],
        responses: {
          '200': { description: '대시보드 데이터' }
        }
      }
    },
    '/stats': {
      get: {
        tags: ['Stats'],
        summary: '매출 통계',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'] } }
        ],
        responses: {
          '200': { description: '통계 데이터' }
        }
      }
    },
    '/brands': {
      get: {
        tags: ['Products'],
        summary: '브랜드 목록',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '브랜드 목록' }
        }
      }
    },
    '/settings': {
      get: {
        tags: ['Settings'],
        summary: '설정 조회',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '설정 값' }
        }
      },
      patch: {
        tags: ['Settings'],
        summary: '설정 변경',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: '변경 성공' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth-token',
        description: 'JWT 토큰 (로그인 시 자동 설정)'
      }
    }
  }
}

export async function GET() {
  return NextResponse.json(openApiSpec)
}
