import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface SimilarListing {
  asking_price: string;
  floor_price: string;
  area: string | null;
  property_type: string | null;
  wilaya: string;
  municipality: string;
}

export interface PriceAdvice {
  min: number;
  max: number;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

export async function suggestFloorPrice(
  newListing: {
    asking_price: string;
    area?: string;
    property_type?: string;
    wilaya: string;
    municipality: string;
    rooms?: string;
    deal_type?: string;
  },
  similarListings: SimilarListing[]
): Promise<PriceAdvice> {

  const hasSimilarData = similarListings.length >= 2;

  const systemPrompt = `أنت خبير تقييم عقاري في الجزائر.
مهمتك اقتراح نطاق سعر تفاوض (floor_price) مناسب للبائع.
السعر السري هو أدنى سعر يقبله البائع — يجب أن يكون منطقياً وليس منخفضاً جداً.
أجب دائماً بـ JSON فقط بهذا الشكل بدون أي نص إضافي:
{"min":رقم,"max":رقم,"reasoning":"جملة واحدة تشرح السبب","confidence":"high" أو "medium" أو "low"}`;

  const userPrompt = hasSimilarData
    ? `العقار الجديد:
- النوع: ${newListing.property_type || "غير محدد"}
- المنطقة: ${newListing.municipality}، ${newListing.wilaya}
- المساحة: ${newListing.area || "غير محدد"} م²
- الغرف: ${newListing.rooms || "غير محدد"}
- السعر المعلن: ${newListing.asking_price} دج
- نوع الصفقة: ${newListing.deal_type || "بيع"}

عقارات مشابهة في نفس المنطقة (${similarListings.length} عقارات):
${similarListings.map((l, i) =>
  `${i + 1}. سعر معلن: ${l.asking_price} دج | سعر تفاوض: ${l.floor_price} دج | مساحة: ${l.area || "?"} م²`
).join("\n")}

اقترح نطاق سعر تفاوض مناسب بناءً على هذه البيانات الحقيقية من السوق الجزائري.`
    : `العقار الجديد:
- النوع: ${newListing.property_type || "غير محدد"}
- المنطقة: ${newListing.municipality}، ${newListing.wilaya}
- المساحة: ${newListing.area || "غير محدد"} م²
- السعر المعلن: ${newListing.asking_price} دج
- نوع الصفقة: ${newListing.deal_type || "بيع"}

لا توجد بيانات مقارنة كافية بعد. اقترح نطاق تفاوض بناءً على السعر المعلن فقط.
في السوق الجزائري عادةً: سعر التفاوض = 85-92% من السعر المعلن للبيع، 90-95% للإيجار.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 250
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as PriceAdvice;

    // validate parsed result
    if (typeof parsed.min === "number" && typeof parsed.max === "number") {
      return parsed;
    }
    throw new Error("Invalid response shape");

  } catch (err) {
    console.error("[PriceAdvisor] Groq error:", err);
    const price = parseFloat(newListing.asking_price) || 0;
    const isRent = newListing.deal_type === "إيجار";
    return {
      min: Math.round(price * (isRent ? 0.90 : 0.85)),
      max: Math.round(price * (isRent ? 0.95 : 0.92)),
      reasoning: "تقدير بناءً على نسب السوق الجزائري المعتادة (لا توجد بيانات مقارنة كافية)",
      confidence: "low"
    };
  }
}
