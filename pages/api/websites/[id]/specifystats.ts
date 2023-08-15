import { NextApiResponse } from 'next';
import { subDays, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { getWebsiteStats, getWebsiteById } from 'queries';
import { NextApiRequestQueryBody, WebsiteStatsAll } from 'lib/types';
import { methodNotAllowed, ok, unauthorized } from 'next-basics';
import { useAuth, useCors } from 'lib/middleware';
import { canViewWebsite } from 'lib/auth';
export interface WebsiteStatsRequestQuery {
  id: string;
}
export default async (
  req: NextApiRequestQueryBody<WebsiteStatsRequestQuery>,
  res: NextApiResponse<WebsiteStatsAll>,
) => {
  await useCors(req, res);
  await useAuth(req, res);
  const { id: websiteId } = req.query;
  if (req.method === 'GET') {
    if (!(await canViewWebsite(req.auth, websiteId))) {
      return unauthorized(res);
    }
    // 获取网站的创建时间
    const activeVisitorsResponse = await getWebsiteById(websiteId);
    const createdAt = activeVisitorsResponse.createdAt;

    // 获取今天的日期范围（从今天的开始到结束）
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 获取昨天的日期范围（从昨天的开始到结束）
    const yesterdayStart = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(subDays(new Date(), 1));

    // 获取本月的日期范围（从本月的开始到结束）
    const thisMonthStart = startOfMonth(new Date());
    const thisMonthEnd = endOfDay(new Date());

    //查询创建到现在的数据
    const createdToNowStats = await getWebsiteStats(websiteId, {
      startDate: new Date(createdAt),
      endDate: new Date(),
      filters: {},
    });

    // 获取今天的数据
    const todayStats = await getWebsiteStats(websiteId, {
      startDate: todayStart,
      endDate: todayEnd,
      filters: {},
    });

    // 获取昨天的数据
    const yesterdayStats = await getWebsiteStats(websiteId, {
      startDate: yesterdayStart,
      endDate: yesterdayEnd,
      filters: {},
    });

    // 获取本月的数据
    const thisMonthStats = await getWebsiteStats(websiteId, {
      startDate: thisMonthStart,
      endDate: thisMonthEnd,
      filters: {},
    });
    const stats = [
      todayStats[0].uniques,
      Number(todayStats[0].pageviews),
      yesterdayStats[0].uniques,
      Number(yesterdayStats[0].pageviews),
      Number(thisMonthStats[0].pageviews),
      Number(createdToNowStats[0].pageviews),
    ];
    return ok(res, stats);
  }
  return methodNotAllowed(res);
};
