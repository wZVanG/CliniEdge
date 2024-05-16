
/**
 * Esta función obtiene el DNI de una persona
 * En una próxima versión, se integrará otro tipo de documento
 * 
 * @param {string} numero - El número de DNI
 */

import { corsHeaders } from '../_shared/cors.ts'


console.log("Hello from getDNI!");

//Types: DNI | RUC

const DEFAULT_HEADER = { headers: {...corsHeaders, "Content-Type": "application/json" }, status: 400 }
const API_SERVICES = {
  APISNET: {
    DNI: {
      token: null,
      URL: "https://api.apis.net.pe/v2/reniec/dni?numero={{numero}}&token={{token}}",
      parseData: function(data: any){
        return data
        },
      getFields: function(){
        return {
          nombres: "nombres",
          apellidoPaterno: "apellidoPaterno",
          apellidoMaterno: "apellidoMaterno",
          tipoDocumento: "tipoDocumento",
          numeroDocumento: "numeroDocumento",
          digitoVerificador: "digitoVerificador"
        }
      }
    },
    RUC: {
      token: null,
      URL: "https://api.apis.net.pe/v2/sunat/ruc?numero={{numero}}&token={{token}}",
      parseData: function(data: any){
        return data
      },
      getFields: function(){
        return {
          razonSocial: "razonSocial",
          nombreComercial: "nombreComercial",
          tipoDocumento: "tipoDocumento",
          numeroDocumento: "numeroDocumento",
          estado: "estado"
        }
      }
    }

  }
}

const API_SERVICE_DEFAULT = "APISNET";

Deno.serve(async (req) => {
  
  console.log("Step 1", typeof req.json)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders})
  }

  console.log("Step 2", typeof req.json)
  
  try{


    if(!req?.json) throw new Error("Petición inválida")

      console.log("Step 3", typeof req.json)

      console.log('Recibiendo solicitud:', req.method, req.url);
      console.log('req.body -->', req.body) 

      let { numero, demo } = await req.json();

      console.log("Step 4", typeof req.json)

      if(!numero) throw new Error("Número de documento no especificado");
    
      numero = String(numero);
    
      const tipo = numero.length === 8 ? "DNI" : "RUC";

      if(tipo !== 'DNI' && tipo !== 'RUC') throw new Error("Tipo de documento inválido");
    
      if(tipo === 'DNI' && numero.length !== 8) throw new Error("Número de DNI inválido");
      if(tipo === 'RUC' && numero.length !== 11) throw new Error("Número de RUC inválido");
    
      const api = API_SERVICES[API_SERVICE_DEFAULT][tipo];
      const token = Deno.env.get(`API_${API_SERVICE_DEFAULT}_TOKEN`) || api.token || "";
    
      const url = api.URL
        .replace("{{numero}}", numero)
        .replace('{{token}}', token);

      
      if(demo) return new Response(JSON.stringify(api.parseData({
        nombres: "Juan",
        apellidoPaterno: "Perez",
        apellidoMaterno: "Gomez",
        tipoDocumento: "1",
        numeroDocumento: numero,
        digitoVerificador: "2"
      })), { ...DEFAULT_HEADER, status: 200 });

      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          //"Content-Type": "application/json"
        }
      });
      
      if (!response.ok)  throw new Error(`Error al obtener información del ${tipo} especificado`);

      console.log("RESPONS JSON", typeof response.json)

      //if(!response.json)
      
      const result = await response.json();
    
      const data = api.parseData(result);
    
      return new Response(
        JSON.stringify(data),
        { ...DEFAULT_HEADER, status: 200 },
      )

  }catch(e){
    
    return new Response(JSON.stringify({
      error: e.message
    }), { ...DEFAULT_HEADER, status: 400 })
  }


})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-dni' \
    --header 'Authorization: Bearer ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
