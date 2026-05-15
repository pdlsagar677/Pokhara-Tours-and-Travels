import { apiClient } from "./client";
import type {
  AIRecommendationsResponse,
  BestSeasonResponse,
  ChatMessage,
  ChatResponse,
  ItineraryResponse,
  SemanticSearchResponse,
  SimilarPackagesResponse,
} from "@/types";

export const aiService = {
  async recommendations(limit = 4): Promise<AIRecommendationsResponse> {
    const res = await apiClient.post<{ data: AIRecommendationsResponse }>(
      "/api/ai/recommendations",
      { limit }
    );
    return res.data.data;
  },

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const res = await apiClient.post<{ data: ChatResponse }>("/api/ai/chat", {
      messages,
    });
    return res.data.data;
  },

  async itinerary(
    slug: string,
    input: { days: number; adults: number; children: number }
  ): Promise<ItineraryResponse> {
    const res = await apiClient.post<{ data: ItineraryResponse }>(
      `/api/ai/itinerary/${encodeURIComponent(slug)}`,
      input
    );
    return res.data.data;
  },

  async bestSeason(slug: string): Promise<BestSeasonResponse> {
    const res = await apiClient.get<{ data: BestSeasonResponse }>(
      `/api/ai/best-season/${encodeURIComponent(slug)}`
    );
    return res.data.data;
  },

  async search(query: string): Promise<SemanticSearchResponse> {
    const res = await apiClient.post<{ data: SemanticSearchResponse }>(
      "/api/ai/search",
      { query }
    );
    return res.data.data;
  },

  async similar(slug: string): Promise<SimilarPackagesResponse> {
    const res = await apiClient.get<{ data: SimilarPackagesResponse }>(
      `/api/ai/similar/${encodeURIComponent(slug)}`
    );
    return res.data.data;
  },
};
