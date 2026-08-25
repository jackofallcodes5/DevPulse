const { pool } = require('../config/database');

const getProjectAnalytics = async (projectId) => {
  const [totalRows] = await pool.execute('SELECT COUNT(*) as cnt FROM issues WHERE project_id = ?', [projectId]);
  const [openRows] = await pool.execute("SELECT COUNT(*) as cnt FROM issues WHERE project_id = ? AND status IN ('TODO', 'IN_PROGRESS', 'REVIEW')", [projectId]);
  const [doneRows] = await pool.execute("SELECT COUNT(*) as cnt FROM issues WHERE project_id = ? AND status = 'DONE'", [projectId]);

  const [priorityRows] = await pool.execute(
    'SELECT priority, COUNT(*) as cnt FROM issues WHERE project_id = ? GROUP BY priority',
    [projectId]
  );
  const [statusRows] = await pool.execute(
    'SELECT status, COUNT(*) as cnt FROM issues WHERE project_id = ? GROUP BY status',
    [projectId]
  );

  const [commitRows] = await pool.execute('SELECT COUNT(*) as cnt FROM github_commits WHERE project_id = ?', [projectId]);
  const [prRows] = await pool.execute('SELECT COUNT(*) as cnt FROM github_pull_requests WHERE project_id = ?', [projectId]);
  const [mergedPrRows] = await pool.execute('SELECT COUNT(*) as cnt FROM github_pull_requests WHERE project_id = ? AND merged = 1', [projectId]);

  const byPriority = priorityRows.reduce((acc, r) => ({ ...acc, [r.priority]: r.cnt }), {});
  const byStatus = statusRows.reduce((acc, r) => ({ ...acc, [r.status]: r.cnt }), {});

  return {
    issues: {
      total: totalRows[0].cnt,
      open: openRows[0].cnt,
      completed: doneRows[0].cnt,
      byPriority,
      byStatus,
    },
    github: {
      commits: commitRows[0].cnt,
      pullRequests: prRows[0].cnt,
      mergedPullRequests: mergedPrRows[0].cnt,
    },
  };
};

const getMonitoringAnalytics = async (monitorId) => {
  const [totalRows] = await pool.execute('SELECT COUNT(*) as cnt FROM monitor_checks WHERE monitor_id = ?', [monitorId]);
  const [successRows] = await pool.execute('SELECT COUNT(*) as cnt FROM monitor_checks WHERE monitor_id = ? AND success = 1', [monitorId]);

  const [checks] = await pool.execute(
    'SELECT response_time_ms, status_code, success, checked_at FROM monitor_checks WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 100',
    [monitorId]
  );

  const [incidents] = await pool.execute(
    'SELECT * FROM incidents WHERE monitor_id = ? ORDER BY started_at DESC LIMIT 20',
    [monitorId]
  );

  const totalChecks = totalRows[0].cnt;
  const successfulChecks = successRows[0].cnt;
  const uptimePercentage = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(2) : 100;

  const validTimes = checks.filter((c) => c.response_time_ms !== null).map((c) => c.response_time_ms);
  const avgResponseTime = validTimes.length > 0 ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : 0;

  return {
    uptimePercentage: parseFloat(uptimePercentage),
    avgResponseTimeMs: avgResponseTime,
    totalChecks,
    successfulChecks,
    failedChecks: totalChecks - successfulChecks,
    recentChecks: checks.reverse().map((c) => ({
      responseTimeMs: c.response_time_ms,
      statusCode: c.status_code,
      success: Boolean(c.success),
      checkedAt: c.checked_at,
    })),
    incidents: incidents.map((i) => ({
      id: i.id,
      status: i.status,
      reason: i.reason,
      startedAt: i.started_at,
      resolvedAt: i.resolved_at,
    })),
  };
};

module.exports = {
  getProjectAnalytics,
  getMonitoringAnalytics,
};
