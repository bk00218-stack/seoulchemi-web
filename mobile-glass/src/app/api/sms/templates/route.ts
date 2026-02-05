import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// SMS 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.smsTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('SMS 템플릿 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// SMS 템플릿 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, category, content, isActive, isAuto } = body;

    // 중복 체크
    const existing = await prisma.smsTemplate.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 템플릿명 또는 코드입니다.' },
        { status: 400 }
      );
    }

    const template = await prisma.smsTemplate.create({
      data: {
        name,
        code,
        category: category || 'general',
        content,
        isActive: isActive !== false,
        isAuto: isAuto || false,
      },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: '템플릿이 등록되었습니다.',
    });
  } catch (error: any) {
    console.error('SMS 템플릿 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
