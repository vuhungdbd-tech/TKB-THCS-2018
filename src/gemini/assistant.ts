import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseState, AIActionRequest, AIAssistantResponse } from '../types';

export async function processAIRequest(
  userQuery: string,
  stateSummary: {
    weekName: string;
    totalClasses: number;
    totalTeachers: number;
    scheduledCount: number;
    totalRequiredCount: number;
    completionRate: number;
    classes: { code: string; name: string }[];
    teachers: { code: string; name: string; mainSubject: string }[];
    unassignedReport?: any;
  }
): Promise<AIAssistantResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      answer: "Vui lòng cấu hình API key cho Gemini (GEMINI_API_KEY) trong cài đặt môi trường để sử dụng Trợ lý AI."
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = `
Bạn là Trợ lý AI chuyên gia thời khóa biểu trường THCS theo chương trình GDPT 2018.
Nhiệm vụ của bạn là:
1. Tra cứu và phân tích dữ liệu thời khóa biểu dựa trên ngữ cảnh thực tế được cung cấp bên dưới.
2. Trả lời các câu hỏi về phân công, trùng lịch, tiết trống, khối lượng dạy của giáo viên một cách chính xác, khách quan.
3. Nếu người dùng đưa ra câu lệnh thay đổi dữ liệu (như cho giáo viên nghỉ, khóa tiết, điều chỉnh phân công, chạy xếp TKB), bạn PHẢI trích xuất hành động có cấu trúc dạng JSON và yêu cầu người dùng xác nhận trước khi thực hiện.

QUY TẮC QUAN TRỌNG:
- Không được tự ý bịa ra dữ liệu không có trong ngữ cảnh.
- Nếu thông tin chưa đủ, hãy trả lời theo dữ liệu hiện có và nêu gợi ý.
`;

    const contextText = `
DỮ LIỆU HIỆN TẠI CỦA TRƯỜNG:
- Tuần học: ${stateSummary.weekName}
- Tổng số lớp: ${stateSummary.totalClasses} (${stateSummary.classes.map(c => c.name).join(', ')})
- Tổng số giáo viên: ${stateSummary.totalTeachers} (${stateSummary.teachers.map(t => `${t.name} (${t.mainSubject})`).join(', ')})
- Tiến độ xếp TKB: ${stateSummary.scheduledCount}/${stateSummary.totalRequiredCount} tiết (${stateSummary.completionRate}%)
- Báo cáo chưa xếp/xung đột: ${JSON.stringify(stateSummary.unassignedReport || 'Không có xung đột')}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { text: contextText },
        { text: `Câu hỏi của người dùng: "${userQuery}"` }
      ],
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: "Câu trả lời tự nhiên chi tiết cho người dùng"
            },
            hasProposedAction: {
              type: Type.BOOLEAN,
              description: "True nếu câu lệnh yêu cầu thực hiện hành động sửa đổi dữ liệu"
            },
            actionType: {
              type: Type.STRING,
              description: "Mã hành động: teacher_unavailability | lock_slot | update_assignment | run_solver | explain_conflicts"
            },
            actionExplanation: {
              type: Type.STRING,
              description: "Mô tả ngắn gọn về thay đổi để hiển thị trong hộp thoại xác nhận"
            },
            actionParams: {
              type: Type.OBJECT,
              description: "Các tham số tương ứng với hành động"
            }
          },
          required: ["answer", "hasProposedAction"]
        }
      }
    });

    const outputText = response.text || "{}";
    const parsed = JSON.parse(outputText);

    let proposedAction: AIActionRequest | undefined = undefined;
    let action: AIAssistantResponse['action'] = undefined;

    if (parsed.hasProposedAction && parsed.actionType) {
      proposedAction = {
        action: parsed.actionType,
        parameters: parsed.actionParams || {},
        explanation: parsed.actionExplanation || "Cập nhật dữ liệu thời khóa biểu",
        requiresConfirmation: true
      };

      if (parsed.actionType === 'run_solver') {
        action = { type: 'run_solver' };
      } else if (parsed.actionType === 'lock_slot') {
        action = {
          type: 'lock_slot',
          classId: parsed.actionParams?.classId,
          dayOfWeek: parsed.actionParams?.dayOfWeek,
          period: parsed.actionParams?.period
        };
      }
    }

    return {
      answer: parsed.answer || "Không thể phân tích câu trả lời.",
      proposedAction,
      action
    };

  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    return {
      answer: `Hệ thống gặp sự cố khi xử lý bằng AI: ${error?.message || 'Lỗi không xác định'}`
    };
  }
}
