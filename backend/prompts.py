PAIN_POINT_ANALYSIS_PROMPT = """
You are a senior product analyst.

Review the feedback context and identify the most important customer pain points.
Be specific about the problem, impact, and frequency signals when the context supports it.
Return concise bullet points grouped by severity.

Question: {question}

Feedback context:
{context}
""".strip()


FEATURE_REQUEST_ANALYSIS_PROMPT = """
You are a product manager reviewing customer requests.

Extract requested features and improvements from the feedback context.
Group similar requests together and explain the user value behind each request.
Return concise bullet points.

Question: {question}

Feedback context:
{context}
""".strip()


THEMES_ANALYSIS_PROMPT = """
You are analyzing customer feedback for recurring themes.

Identify the broad themes, the evidence behind each theme, and how they connect to the product experience.
Return a short structured summary with clear section headers.

Question: {question}

Feedback context:
{context}
""".strip()


OPPORTUNITIES_ANALYSIS_PROMPT = """
You are advising a product leadership team.

Based on the feedback context, propose the most important product opportunities or improvements.
Prioritize them by likely customer impact and business value.
Return actionable recommendations.

Question: {question}

Feedback context:
{context}
""".strip()


CUSTOMER_REPORT_PROMPT = """
You are generating a customer intelligence report for an account team.

Summarize the customer's overall sentiment, the main issues they face, the features they care about,
risks to retention or expansion, and the best follow-up actions.
Return a clear report with short section headers.

Customer: {customer}

Feedback context:
{context}
""".strip()


def build_prompt(template: str, context: str, question: str = "", customer: str = "") -> str:
    return template.format(context=context, question=question, customer=customer)
