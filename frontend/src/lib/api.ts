export function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
  if (!match) return undefined
  return decodeURIComponent(match.slice(name.length + 1))
}

function sendJSON(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<Response> {
  const csrf = getCookie("XSRF-TOKEN") ?? ""
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": csrf,
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  })
}

export function postJSON(url: string, body?: unknown): Promise<Response> {
  return sendJSON("POST", url, body)
}

export function putJSON(url: string, body: unknown): Promise<Response> {
  return sendJSON("PUT", url, body)
}

export function patchJSON(url: string, body: unknown): Promise<Response> {
  return sendJSON("PATCH", url, body)
}

export function deleteJSON(url: string): Promise<Response> {
  return sendJSON("DELETE", url)
}

export function getJSON(url: string): Promise<Response> {
  return fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
}

export function putJSONKeepalive(url: string, body: unknown): void {
  const csrf = getCookie("XSRF-TOKEN") ?? ""
  fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-XSRF-TOKEN": csrf,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    credentials: "same-origin",
    keepalive: true,
  })
}

export function uploadFile(
  file: File,
  params: { responseId: string; questionId: string },
): Promise<Response> {
  const csrf = getCookie("XSRF-TOKEN") ?? ""
  const form = new FormData()
  form.append("file", file)
  const qs = new URLSearchParams({
    response_id: params.responseId,
    question_id: params.questionId,
  })
  return fetch(`/api/uploads?${qs.toString()}`, {
    method: "POST",
    headers: {
      "X-XSRF-TOKEN": csrf,
      Accept: "application/json",
    },
    body: form,
    credentials: "same-origin",
  })
}
