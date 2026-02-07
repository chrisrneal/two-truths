import { NextResponse } from 'next/server';
import { createRound, getClientRound } from '@/lib/game/round';

/**
 * Test endpoint for createRound function
 * GET /api/test-create-round?seed=20260207&roundIndex=0
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seed = searchParams.get('seed') || '20260207';
    const roundIndex = parseInt(searchParams.get('roundIndex') || '0', 10);
    
    console.log('Creating round with seed:', seed, 'roundIndex:', roundIndex);
    
    // Create a round
    const round = await createRound(seed, roundIndex);
    
    console.log('Round created:', {
      roundId: round.roundId,
      seed: round.seed,
      roundIndex: round.roundIndex,
      itemCount: round.items.length,
      items: round.items,
      correctItemId: round.correctItemId,
    });
    
    // Get client-safe version (without correctItemId)
    const clientRound = getClientRound(round);
    
    return NextResponse.json({
      success: true,
      round: clientRound,
      debug: {
        correctItemId: round.correctItemId,
        itemIds: round.items.map(i => i.id),
        itemKinds: round.items.map(i => i.kind),
      },
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
