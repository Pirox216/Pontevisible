import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  // Parche de CORS universal
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nombre, descripcion, ciudad, departamento, direccion, redes } = await req.json();

    const prompt = `
    Eres un experto en marketing digital y SEO local para Colombia.
    Analiza el siguiente negocio y genera 3 recomendaciones concretas y accionables para mejorar su visibilidad online:
    
    Nombre: ${nombre}
    Descripción: ${descripcion}
    Ubicación: ${ciudad}, ${departamento} - Dirección: ${direccion}
    Redes: ${JSON.stringify(redes)}
    
    Formato de respuesta: Una lista con 3 puntos (usando viñetas -).
    `;

    const respuestaIA = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const datosIA = await respuestaIA.json();
    const recomendaciones = datosIA.choices[0].message.content;

    return new Response(
      JSON.stringify({ recomendaciones }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error al analizar el negocio" }),
      { status: 500, headers: corsHeaders }
    );
  }
});