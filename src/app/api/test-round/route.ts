import { NextResponse } from 'next/server';
import { MOCK_HEADLINES } from '@/lib/mock-headlines';
import { selectRandomHeadlines } from '@/lib/headlines';

export async function GET() {
  try {
    const selected = selectRandomHeadlines(MOCK_HEADLINES, 2, '20260207');
    
    console.log('Selected headlines type:', typeof selected);
    console.log('Selected headlines:', selected);
    console.log('Selected length:', selected.length);
    console.log('Selected[0]:', selected[0]);
    console.log('Selected[1]:', selected[1]);
    
    const mapped = selected.map(h => ({
      id: h.id,
      text: h.text,
      isFake: false,
      source: h.source,
      url: h.url,
    }));
    
    console.log('Mapped:', mapped);
    
    return NextResponse.json({
      success: true,
      selected: selected.length,
      mapped: mapped.length,
      selectedItems: selected,
      data: mapped,
    });
  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
