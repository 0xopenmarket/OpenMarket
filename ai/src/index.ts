import { Request, Response, route } from "./httpSupport";
import fetch from "node-fetch";

async function fetchArticle(url: string): Promise<string> {
	const response = await fetch(url);
	const contentType = response.headers.get("content-type");


	return await response.text();

	
}

async function processWithRedPillAI(
	prompt: string,
	apiKey: string,
	model: string = "gpt-4o",
): Promise<string> {
	const response = await fetch("https://api.red-pill.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			messages: [{ role: "user", content: prompt }],
			model: model,
		}),
	});

	const responseData = await response.json();
	if (responseData.error) {
		throw new Error(responseData.error);
	}
	return responseData.choices[0].message.content;
}

async function extractInformation(text: string, apiKey: string): Promise<any> {
	const prompt = `Extract key information from the following content. Provide a JSON object with relevant fields such as title, author, date, main points, and any other important details. If the content is not an article, describe what it contains:\n\n${text}`;
	const result = await processWithRedPillAI(prompt, apiKey);
	return JSON.parse(result);
}

async function answerQuestion(
	question: string,
	apiKey: string,
): Promise<string> {
	const prompt = `Please answer the following question to the best of your ability: ${question}`;
	return await processWithRedPillAI(prompt, apiKey);
}

async function formatGeneratedPredictions(predictions: string[], apiKey: string): Promise<string> {
	const prompt = `Format the following predictions into a valid JSON array, ensuring each prediction object has the correct structure with "description", "duration", "minVotes", "maxVotes", "predictionType", "optionsCount", and "tags" fields. Here are the predictions:
  
  ${predictions.join('\n')}
  
  Please output only the formatted JSON array, without any additional text or explanations.`;
  
	const formattedJson = await processWithRedPillAI(prompt, apiKey);
	
	// Ensure the result is valid JSON
	try {
	  JSON.parse(formattedJson);
	  return formattedJson;
	} catch (error) {
	  console.error("Error parsing formatted JSON:", error);
	  throw new Error("Failed to format predictions into valid JSON");
	}
  }
  
  async function generatePredictions(data: string, apiKey: string): Promise<string> {
	const prompt = `Based on the following prediction market data, generate 3 new, creative prediction questions that are related to the themes present in the data but not exact duplicates. Each question should be specific, measurable, and have a clear timeframe. The Current Year is 2024. Always create predictions further than the current time. Output in the format given as an example.
  
  Example format:
  {
	"description": "Will the European Central Bank officially launch the digital euro by the end of 2025?",
	"duration": 63072000,
	"minVotes": 1,
	"maxVotes": 1000,
	"predictionType": 0,
	"optionsCount": 2,
	"tags": ["finance", "CBDC", "Euro", "regulation"]
  }
  
  Strictly follow the example and always have minVotes as 1. Create near recent predictions. Don't include any comments or extra text, just provide well-formatted JSON objects.
  
  Here's the data:
  
  ${data}
  
  New Prediction Questions:`;
  
	const result = await processWithRedPillAI(prompt, apiKey);
	const predictions = result.split('\n').filter(line => line.trim() !== '');
	
	// Format the generated predictions into proper JSON
	const formattedPredictions = await formatGeneratedPredictions(predictions, apiKey);
	
	return formattedPredictions;
  }

function getApiKey(req: Request): string {
	const secrets = req.secret || {};
	if (typeof secrets.apiKey === "string") {
		return secrets.apiKey;
	}
	return "sk-qVBlJkO3e99t81623PsB0zHookSQJxU360gDMooLenN01gv2";
}

async function GET(req: Request): Promise<Response> {
	const queries = req.queries;
	const apiKey = getApiKey(req);
	const url = queries.url ? queries.url[0] : "";
	const question = queries.query ? queries.query[0] : "";
	const generatePredictionsFlag = queries.generatePredictions ? queries.generatePredictions[0] === "true" : false;

	if (url) {
		try {
			const content = await fetchArticle(url);
			if (generatePredictionsFlag) {
				// Generate predictions based on the content
				const predictions = await generatePredictions(content, apiKey);
				return new Response(JSON.stringify({ predictions }));
			} else {
				// Handle article analysis
				const result = await extractInformation(content, apiKey);
				return new Response(JSON.stringify(result));
			}
		} catch (error) {
			console.error("Error processing content:", error);
			return new Response(
				JSON.stringify({ error: "Failed to process content" }),
			);
		}
	} else if (question) {
		// Handle open-ended question
		try {
			const answer = await answerQuestion(question, apiKey);
			return new Response(JSON.stringify({ answer }));
		} catch (error) {
			console.error("Error answering question:", error);
			return new Response(
				JSON.stringify({ error: "Failed to answer question" }),
			);
		}
	} else {
		return new Response(
			JSON.stringify({ error: "Either URL or query parameter is required" }),
		);
	}
}

export default async function main(request: string) {
	return await route({ GET }, request);
}