export default {
    async fetch(request): Promise<Response> {
        const corsHeaders = {
            // "Access-Control-Allow-Origin": "https://www.hkss.ltd",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
            "Access-Control-Max-Age": "86400",
        };

        // The URL for the remote third party API you want to fetch from
        // but does not implement CORS
        const data_gov_hk_url 	= "https://data.cr.gov.hk/cr/api/api/v1/api_builder/json/local/search";
        const company_name_url 	= "?query[0][key1]=Comp_name&query[0][key2]=begins_with&query[0][key3]=";
        const br_no_url 	= "?query[0][key1]=Brn&query[0][key2]=equal&query[0][key3]=";

        // The endpoint you want the CORS reverse proxy to be on
        const PROXY_ENDPOINT = "/corsproxy/";

        async function handleRequest(request) {
            const url = new URL(request.url);
            let company_name = url.searchParams.get("company_name");
            let br_no = url.searchParams.get("br_no");
			let apiUrl = data_gov_hk_url;

            if (company_name !== null) {
                apiUrl += company_name_url+company_name;
            }else if (br_no !== null) {
                apiUrl += br_no_url+br_no;
            }

            // 验证请求来源
            const origin = request.headers.get("Origin");
            // if (origin !== "https://www.hkss.ltd") {
            //     return new Response("Unauthorized", { status: 403 });
            // }

            // Rewrite request to point to API URL
            request = new Request(apiUrl, request);
            request.headers.set("Origin", new URL(apiUrl).origin);
            request.headers.set("Accept", "application/json");
            
            let response = await fetch(request);
            
            // Recreate the response so you can modify the headers
            response = new Response(response.body, response);
            
            // Set CORS headers
            // response.headers.set("Access-Control-Allow-Origin", "https://www.hkss.ltd");
            response.headers.set("Access-Control-Allow-Origin", "*");
            response.headers.set("Content-Type", "application/json");

            // Append to/Add Vary header so browser will cache response correctly
            response.headers.append("Vary", "Origin");

            return response;
        }

        async function handleOptions(request) {
            if (
                request.headers.get("Origin") !== null &&
                request.headers.get("Access-Control-Request-Method") !== null &&
                request.headers.get("Access-Control-Request-Headers") !== null
            ) {
                // Handle CORS preflight requests.
                return new Response(null, {
                    headers: {
                        ...corsHeaders,
                        "Access-Control-Allow-Headers": request.headers.get(
                            "Access-Control-Request-Headers",
                        ),
                    },
                });
            } else {
                // Handle standard OPTIONS request.
                return new Response(null, {
                    headers: {
                        Allow: "GET, HEAD, POST, OPTIONS",
                    },
                });
            }
        }

        // 默认直接处理API请求，不再返回演示页面
        if (request.method === "OPTIONS") {
            // Handle CORS preflight requests
            return handleOptions(request);
        } else if (
            request.method === "GET" ||
            request.method === "HEAD" ||
            request.method === "POST"
        ) {
            // Handle requests to the API server
            return handleRequest(request);
        } else {
            return new Response(null, {
                status: 405,
                statusText: "Method Not Allowed",
            });
        }
    },
} satisfies ExportedHandler;
