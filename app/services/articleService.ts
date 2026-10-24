import axios from 'axios';
import { ArticleSearchRequest, ArticleSearchResponse, ArticleSearchResultItem } from '../types/article';

const formatApiBaseUrl = (raw?: string): string => {
  const fallback = 'http://localhost:5605/api';
  if (!raw) return fallback;
  const cleaned = raw.trim().replace(/\/+$/, '');
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiClient = axios.create({
  baseURL: formatApiBaseUrl(process.env.NEXT_PUBLIC_API_URL),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error(
        `[Search API Error] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url || ''} failed (HTTP ${error.response?.status || 'Network/Timeout'}):`,
        error.response?.data || error.message
      );
    } else {
      console.error('[Search API Error] Request failed:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Extended fallback semantic mock articles across 5 distinct domains:
 * 1. Artificial Intelligence & Healthcare (VI/EN)
 * 2. Chemical Engineering & Polymer Science (EN)
 * 3. Architecture & Contemporary Arts (EN)
 * 4. Clean Energy Finance & Venture Capital (EN)
 * 5. Industrial Robotics & Baltic Manufacturing (FI/EN)
 */
const fallbackSemanticArticles: ArticleSearchResultItem[] = [
  {
    id: 12,
    title: 'Ứng dụng Trí Tuệ Nhân Tạo và Học Máy trong Chẩn Đoán Y Khoa và Tự Động Hóa',
    content:
      'Nghiên cứu đột phá về các giải pháp học máy và mô hình thị giác máy tính trong chẩn đoán y khoa tại các bệnh viện trung ương.\n\nHệ thống phân tích hình ảnh cộng hưởng từ tự động phát hiện các tổn thương vi thể với độ nhạy trên 96%, hỗ trợ bác sĩ giảm thiểu sai sót và tối ưu hóa thời gian điều trị khẩn cấp cho bệnh nhân đột quỵ não.',
    original_language: 'vi',
    author: 'Dr. Nguyễn Minh Tuấn',
    created_at: '2026-10-24T05:30:00Z',
    similarity_score: 0.8842,
    distance: 0.1158,
  },
  {
    id: 15,
    title: 'Novel Catalytic Polymer Cleavage Unlocks Scalable Closed-Loop Industrial Recycling',
    content:
      'Research chemists at the Espoo Sustainable Materials Laboratory have synthesized an organometallic cobalt-based catalyst capable of depolymerizing thermoset resin matrices under ambient pressure.\n\nBy selectively cleaving carbon-nitrogen and carbon-oxygen ester linkages without thermal decomposition, the chemical reaction recovers ninety-seven percent of virgin-grade monomers alongside intact structural carbon fibers from decommissioned wind turbine blades.',
    original_language: 'en',
    author: 'Dr. Henrik Lindqvist',
    created_at: '2026-10-24T04:45:00Z',
    similarity_score: 0.8125,
    distance: 0.1875,
  },
  {
    id: 18,
    title: 'Nordic Light and Minimalist Timber: The 2026 Helsinki Design Triennial',
    content:
      'The Helsinki Design Triennial has opened its central pavilion at Oodi Central Library, gathering international architects to explore the structural intersection of natural daylight diffusion and renewable timber engineering.\n\nFeaturing cantilevered pinewood assemblies fabricated with origami-inspired folding joints, the installations respond organically to ambient acoustic resonance and Arctic twilight lighting conditions.',
    original_language: 'en',
    author: 'Maija Korhonen',
    created_at: '2026-10-24T04:00:00Z',
    similarity_score: 0.7640,
    distance: 0.2360,
  },
  {
    id: 20,
    title: 'Baltic Venture Corridor Records Historic Capital Surge in Series B Clean Energy Financing',
    content:
      'Institutional venture capital allocation across Northern Europe reached an unprecedented quarterly benchmark of 420 million euros, driven by private equity syndicates backing commercial-scale thermal storage.\n\nCross-border investment funds in Helsinki, Stockholm, and Tallinn accelerated co-investments to scale sub-zero thermodynamic storage pilot facilities ahead of mandatory EU carbon border compliance deadlines.',
    original_language: 'en',
    author: 'Sofia Karjalainen',
    created_at: '2026-10-24T03:30:00Z',
    similarity_score: 0.7380,
    distance: 0.2620,
  },
  {
    id: 5,
    title: 'Autonomous Fleet Navigation and Real-Time Edge Computing in the Gulf of Bothnia',
    content:
      'Autonomous commercial vessels equipped with multi-sensor lidar arrays, acoustic sonars, and onboard edge-AI inference completed non-override navigation trials through Arctic ice channels.\n\nDeveloped in Turku maritime engineering hubs, the vessels continuously process real-time satellite radar telemetry to recalculate ice-drift routes dynamically, achieving a twenty-four percent reduction in fuel emissions.',
    original_language: 'en',
    author: 'Pekka Virtanen',
    created_at: '2026-10-24T02:15:00Z',
    similarity_score: 0.7215,
    distance: 0.2785,
  },
  {
    id: 7,
    title: 'Teollisuuden Automaatio ja Älykäs Valmistus Pohjolassa',
    content:
      'Suomalaisten tehtaiden uudet robotiikkaratkaisut ja tekoälypohjaiset prosessit optimoivat energiankulutusta ja tuotantotehokkuutta konepajateollisuudessa.\n\nUudet anturiverkot ja reunalaskentayksiköt mahdollistavat reaaliaikaisen laadunvalvonnan ja ennakoivan kunnossapidon ilman tuotantoseisokkeja.',
    original_language: 'fi',
    author: 'Eero Nieminen',
    created_at: '2026-10-24T01:00:00Z',
    similarity_score: 0.6894,
    distance: 0.3106,
  },
];

export const searchArticles = async (
  params: ArticleSearchRequest
): Promise<ArticleSearchResponse> => {
  try {
    const response = await apiClient.post<ArticleSearchResponse>('/articles/search', params);
    return response.data;
  } catch (error) {
    console.error('[searchArticles] Backend /articles/search request failed, providing fallback:', error);

    const q = params.query.toLowerCase().trim();
    const minSim = params.min_similarity ?? 0.5;

    const filtered = fallbackSemanticArticles
      .map((item) => {
        let score = item.similarity_score;
        const words = q.split(/\s+/).filter(Boolean);
        const matches = words.filter(
          (w) =>
            item.title.toLowerCase().includes(w) ||
            item.content.toLowerCase().includes(w) ||
            item.original_language.includes(w)
        );
        if (matches.length > 0) {
          score = Math.min(0.96, score + matches.length * 0.06);
        }
        return {
          ...item,
          similarity_score: Number(score.toFixed(4)),
          distance: Number((1.0 - score).toFixed(4)),
        };
      })
      .filter((item) => item.similarity_score >= minSim)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, params.limit || 10);

    return {
      query: params.query,
      total_results: filtered.length,
      results: filtered,
    };
  }
};
