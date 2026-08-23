import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY")!;

serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { nombre, descripcion, ciudad, departamento, direccion, redes } = await req.json();

    const prompt = `
    Eres un experto en marketing digital y SEO local para Colombia.
    Analiza el siguiente negocio y genera 3 recomendaciones concretas y accionables para mejorar su visibilidad online:
    
    Nombre: ${nombre}
    Descripción: ${descripcion}
    Ubicación: ${ciudad}, ${departamento}
    Dirección: ${direccion}
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
      { headers: { ...headers, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error interno al procesar la solicitud" }),
      { status: 500, headers }
    );
  }
});