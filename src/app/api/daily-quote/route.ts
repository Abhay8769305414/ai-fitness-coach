import { NextResponse } from 'next/server';

// Pre-defined list of motivational quotes
const quotes = [
    "The only bad workout is the one that didn't happen.",
    "Discipline is the bridge between goals and accomplishment.",
    "Your body can stand almost anything. It’s your mind that you have to convince.",
    "Success isn't always about greatness. It's about consistency. Consistent hard work gains success. Greatness will come.",
    "The pain you feel today will be the strength you feel tomorrow."
];

export async function GET() {
    try {
        // Select a random quote from the list
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        // Return the quote in the expected format
        return NextResponse.json({ quote: randomQuote });

    } catch (error) {
        console.error("Error in daily-quote API:", error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to fetch daily quote." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}