import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${safeName}`;

    // Target upload folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const videoUrl = `/uploads/videos/${filename}`;

    return NextResponse.json({
      success: true,
      filename,
      videoUrl,
      size: file.size,
      type: file.type,
      message: 'Video file uploaded successfully!'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Video upload failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
