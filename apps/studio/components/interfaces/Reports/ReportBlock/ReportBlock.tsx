import { X } from 'lucide-react'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Dashboards, SqlSnippets } from 'types'
import { Button, cn } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { DEPRECATED_REPORTS } from '../Reports.constants'
import { ChartBlock } from './ChartBlock'
import { DeprecatedChartBlock } from './DeprecatedChartBlock'

interface ReportBlockProps {
  item: Dashboards.Chart
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  disableUpdate: boolean
  isRefreshing: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: ({
    chart,
    chartConfig,
  }: {
    chart?: Partial<Dashboards.Chart>
    chartConfig?: Partial<ChartConfig>
  }) => void
}

export const ReportBlock = ({
  item,
  startDate,
  endDate,
  interval,
  disableUpdate,
  isRefreshing,
  onRemoveChart,
  onUpdateChart,
}: ReportBlockProps) => {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const isSnippet = item.attribute.startsWith('snippet_')

  const { data, error, isLoading, isError } = useContentIdQuery(
    { projectRef, id: item.id },
    {
      enabled: isSnippet && !!item.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchIntervalInBackground: false,
      retry: (failureCount: number) => {
        if (failureCount >= 2) return false
        return true
      },
    }
  )
  const sql = isSnippet ? (data?.content as SqlSnippets.Content)?.sql : undefined
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...(item.chartConfig ?? {}) }
  const isDeprecatedChart = DEPRECATED_REPORTS.includes(item.attribute)
  const snippetMissing = error?.message.includes('Content not found')

  return (
    <>
      {isSnippet ? (
        <QueryBlock
          runQuery
          isChart
          draggable
          id={item.id}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          label={item.label}
          chartConfig={chartConfig}
          sql={sql}
          maxHeight={232}
          queryHeight={232}
          actions={
            <ButtonTooltip
              type="text"
              icon={<X />}
              className="w-7 h-7"
              onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
              tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
            />
          }
          onUpdateChartConfig={onUpdateChart}
          noResultPlaceholder={
            <div
              className={cn(
                'flex flex-col gap-y-1 h-full w-full',
                isLoading ? 'justify-start items-start p-2 gap-y-2' : 'justify-center px-4 gap-y-1'
              )}
            >
              {isLoading ? (
                <>
                  <ShimmeringLoader className="w-full" />
                  <ShimmeringLoader className="w-full w-3/4" />
                  <ShimmeringLoader className="w-full w-1/2" />
                </>
              ) : isError ? (
                <>
                  <p className="text-xs text-foreground-light text-center">
                    {snippetMissing ? 'SQL snippet cannot be found' : 'Error fetching SQL snippet'}
                  </p>
                  <p className="text-xs text-foreground-lighter text-center">
                    {snippetMissing ? 'Please remove this block from your report' : error.message}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-foreground-light text-center">
                    No results returned from query
                  </p>
                  <p className="text-xs text-foreground-lighter text-center">
                    Results from the SQL query can be viewed as a table or chart here
                  </p>
                </>
              )}
            </div>
          }
          readOnlyErrorPlaceholder={
            <div className="flex flex-col h-full justify-center items-center text-center">
              <p className="text-xs text-foreground-light">
                SQL query is not read-only and cannot be rendered
              </p>
              <p className="text-xs text-foreground-lighter text-center">
                Queries that involve any mutation will not be run in reports
              </p>
              <Button
                type="default"
                className="mt-2"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
              >
                Remove chart
              </Button>
            </div>
          }
        />
      ) : isDeprecatedChart ? (
        <DeprecatedChartBlock
          attribute={item.attribute}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
        />
      ) : (
        <ChartBlock
          startDate={startDate}
          endDate={endDate}
          interval={interval}
          attribute={item.attribute}
          provider={item.provider}
          defaultChartStyle={item.chart_type}
          maxHeight={176}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
          onUpdateChartConfig={onUpdateChart}
        />
      )}
    </>
  )
}
