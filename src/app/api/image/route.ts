import { NextRequest, NextResponse } from 'next/server';

// Using Next.js API route as a proxy to avoid CORS when fetching Unsplash images.
export async function GET(request: NextRequest) {
    try {
        // Read the query parameter 'q' (the search keyword)
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter "q" is required' },
                { status: 400 }
            );
        }

        // Fetch the Unsplash image
        const unsplashUrl = `https://source.unsplash.com/600x600/?${encodeURIComponent(query)}`;
        const response = await fetch(unsplashUrl, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Return the final image URL (after redirects)
        const finalImageUrl = response.url;

        // Verify it's a valid image URL
        if (!finalImageUrl || (!finalImageUrl.includes('unsplash.com') && !finalImageUrl.startsWith('http'))) {
            throw new Error('Invalid image URL received from Unsplash');
        }

        return NextResponse.json({ imageUrl: finalImageUrl });

    } catch (error) {
        console.error('Error in image API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch image' },
            { status: 500 }
        );
    }
}
