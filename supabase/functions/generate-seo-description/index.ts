import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, currentDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert SEO copywriter specializing in e-commerce product descriptions. Your goal is to create compelling, keyword-rich descriptions that:

1. Start with the most important keywords naturally integrated
2. Highlight key features and benefits
3. Use power words that drive conversions (exclusive, premium, limited, etc.)
4. Include relevant long-tail keywords for marketplace search algorithms
5. Are optimized for Facebook Marketplace, Poshmark, and Squarespace
6. Keep descriptions between 100-200 words for optimal readability
7. Use bullet points sparingly for key features
8. End with a subtle call-to-action

Write in a professional yet approachable tone. Focus on what makes the item special and why buyers should act now.`;

    const userPrompt = `Create an SEO-optimized product description for:

Product Title: ${title}
Category: ${category || "General"}
${currentDescription ? `Current Description (use as reference): ${currentDescription}` : ""}

Generate a compelling, SEO-friendly description that will help this item rank well and convert browsers into buyers.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate description");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
