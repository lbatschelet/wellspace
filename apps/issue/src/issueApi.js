/**
 * API client for issue submissions.
 * Single responsibility: HTTP communication with the issues endpoint.
 */

export function createIssueApi({ apiBase }) {
  return {
    /**
     * Submit an issue to the API.
     * @param {object} payload
     * @returns {Promise<{ success: boolean, issue_url: string }>}
     */
    async submitIssue(payload) {
      const response = await fetch(`${apiBase}/issues.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        const message = data?.error || data?.message || 'Request failed'
        throw new Error(message)
      }
      return data
    },
  }
}

