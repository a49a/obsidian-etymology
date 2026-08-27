import { requestUrl } from "obsidian";
import type { ModelProvider } from "./settings";

interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

interface ChatCompletionsRequest {
	model: string;
	messages: ChatMessage[];
	temperature?: number;
}

interface ChatCompletionsResponse {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
	error?: {
		message?: string;
	};
}

interface AnthropicResponse {
	content?: Array<{
		type?: string;
		text?: string;
	}>;
	error?: {
		message?: string;
	};
}

interface GeminiResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string;
			}>;
		};
	}>;
	error?: {
		message?: string;
	};
}

export interface AIGenerateParams {
	provider: ModelProvider;
	apiKey: string;
	baseUrl: string;
	model: string;
	prompt: string;
}

function trimUrl(url: string): string {
	return url.replace(/\/+$/, "");
}

async function requestOpenAICompatible(params: AIGenerateParams): Promise<string> {
	const endpoint = `${trimUrl(params.baseUrl)}/chat/completions`;
	const body: ChatCompletionsRequest = {
		model: params.model,
		messages: [{ role: "user", content: params.prompt }],
		temperature: 0.7,
	};

	const response = await requestUrl({
		url: endpoint,
		method: "POST",
		headers: {
			Authorization: `Bearer ${params.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = response.json as ChatCompletionsResponse;
	if (data.error?.message) {
		throw new Error(data.error.message);
	}

	const content = data.choices?.[0]?.message?.content?.trim();
	if (!content) {
		throw new Error("AI returned empty content");
	}

	return content;
}

async function requestAnthropic(params: AIGenerateParams): Promise<string> {
	const endpoint = trimUrl(params.baseUrl);
	const body = {
		model: params.model,
		max_tokens: 1024,
		messages: [{ role: "user", content: params.prompt }],
	};

	const response = await requestUrl({
		url: endpoint,
		method: "POST",
		headers: {
			"x-api-key": params.apiKey,
			"anthropic-version": "2023-06-01",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = response.json as AnthropicResponse;
	if (data.error?.message) {
		throw new Error(data.error.message);
	}

	const text = data.content
		?.filter((item) => item.type === "text" && typeof item.text === "string")
		.map((item) => item.text?.trim() ?? "")
		.join("\n\n")
		.trim();

	if (!text) {
		throw new Error("AI returned empty content");
	}

	return text;
}

async function requestGemini(params: AIGenerateParams): Promise<string> {
	const hasGenerateAction = params.baseUrl.includes(":generateContent");
	const base = trimUrl(params.baseUrl);
	const endpointBase = hasGenerateAction ? base : `${base}/${params.model}:generateContent`;
	const separator = endpointBase.includes("?") ? "&" : "?";
	const endpoint = `${endpointBase}${separator}key=${encodeURIComponent(params.apiKey)}`;

	const body = {
		contents: [{ parts: [{ text: params.prompt }] }],
	};

	const response = await requestUrl({
		url: endpoint,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const data = response.json as GeminiResponse;
	if (data.error?.message) {
		throw new Error(data.error.message);
	}

	const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
	if (!text) {
		throw new Error("AI returned empty content");
	}

	return text;
}

export async function generateWithAI(params: AIGenerateParams): Promise<string> {
	switch (params.provider) {
		case "anthropic":
			return requestAnthropic(params);
		case "gemini":
			return requestGemini(params);
		case "deepseek":
		case "openai":
		case "glm":
		case "custom":
		default:
			return requestOpenAICompatible(params);
	}
}
