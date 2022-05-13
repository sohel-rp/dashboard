import React, { useEffect, useState } from 'react'
import { Progressing, showError } from '../../../../common'
import DeploymentHistoryHeader from './DeploymentHistoryHeader'
import { getDeploymentHistoryDetail, prepareHistoryData } from '../service'
import { useParams } from 'react-router'
import {
    DeploymentTemplateOptions,
    CompareViewDeploymentType,
    DeploymentHistoryDetail,
    DeploymentHistoryParamsType,
} from '../cd.type'
import DeploymentHistorySidebar from './DeploymentHistorySidebar'
import DeploymentHistoryDiffView from './DeploymentHistoryDiffView'

export default function DeploymentHistoryDetailedView({
    showTemplate,
    setShowTemplate,
    loader,
    setLoader,
    deploymentHistoryList,
    setDeploymentHistoryList,
}: CompareViewDeploymentType) {
    const { appId, pipelineId, historyComponent, baseConfigurationId, historyComponentName } =
        useParams<DeploymentHistoryParamsType>()
    const [selectedDeploymentTemplate, setSelectedDeploymentTemplate] = useState<DeploymentTemplateOptions>()
    const [currentConfiguration, setCurrentConfiguration] = useState<DeploymentHistoryDetail>()
    const [baseTemplateConfiguration, setBaseTemplateConfiguration] = useState<DeploymentHistoryDetail>()
    const [codeEditorLoading, setCodeEditorLoading] = useState<boolean>(false)

    useEffect(() => {
        setLoader(true)

        if (selectedDeploymentTemplate) {
            try {
                getDeploymentHistoryDetail(
                    appId,
                    pipelineId,
                    selectedDeploymentTemplate.value,
                    historyComponent,
                    historyComponentName,
                ).then((response) => {
                    setCurrentConfiguration(prepareHistoryData(response.result, historyComponent))
                    setLoader(false)
                })
            } catch (err) {
                showError(err)
                setLoader(false)
            }
        }
    }, [selectedDeploymentTemplate])

    useEffect(() => {
        try {
            setCodeEditorLoading(true)
            if (baseConfigurationId) {
                getDeploymentHistoryDetail(
                    appId,
                    pipelineId,
                    baseConfigurationId,
                    historyComponent,
                    historyComponentName,
                ).then((response) => {
                    setBaseTemplateConfiguration(prepareHistoryData(response.result, historyComponent))
                    setCodeEditorLoading(false)
                })
            }
        } catch (err) {
            showError(err)
            setCodeEditorLoading(false)
        }
    }, [baseConfigurationId, historyComponent, historyComponentName])

    useEffect(() => {
        if (!showTemplate) {
            setShowTemplate(true)
        }

        return (): void => {
            if (showTemplate) {
                setShowTemplate(false)
            }
        }
    }, [showTemplate])

    return (
        <>
            <DeploymentHistoryHeader
                selectedDeploymentTemplate={selectedDeploymentTemplate}
                setSelectedDeploymentTemplate={setSelectedDeploymentTemplate}
                setShowTemplate={setShowTemplate}
                setLoader={setLoader}
            />

            <div className="historical-diff__container bcn-1">
                <DeploymentHistorySidebar
                    deploymentHistoryList={deploymentHistoryList}
                    setDeploymentHistoryList={setDeploymentHistoryList}
                />
                {loader ? (
                    <Progressing pageLoader />
                ) : (
                    <DeploymentHistoryDiffView
                        currentConfiguration={currentConfiguration}
                        baseTemplateConfiguration={baseTemplateConfiguration}
                        codeEditorLoading={codeEditorLoading}
                    />
                )}
            </div>
        </>
    )
}
