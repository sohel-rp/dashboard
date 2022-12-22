import React, { useEffect } from 'react'
import HelmCollage from '../../assets/img/guided-helm-collage.png'
import HelmCluster from '../../assets/img/guided-helm-cluster.png'
import DeployCICD from '../../assets/img/guide-onboard.png'
import { NavLink } from 'react-router-dom'
import { AppListConstants, ModuleNameMap, SERVER_MODE, URLS } from '../../config'
import { ReactComponent as ArrowRight } from '../../assets/icons/ic-arrow-right.svg'
import { handlePostHogEventUpdate, LOGIN_COUNT, POSTHOG_EVENT_ONBOARDING } from './onboarding.utils'
import GuideCommonHeader from './GuideCommonHeader'
import { OnboardingGuideProps } from './OnboardingGuide.type'
import { updateLoginCount } from '../../services/service'
import './onboardingGuide.scss'
import ContentCard from '../common/ContentCard/ContentCard'
import { CardLinkIconPlacement } from '../common/ContentCard/ContentCard.types'

export default function OnboardingGuide({ loginCount, serverMode, isGettingStartedClicked }: OnboardingGuideProps) {
    useEffect(() => {
        return () => {
            if (loginCount === 0) {
                const updatedPayload = {
                    key: LOGIN_COUNT,
                    value: '1',
                }
                updateLoginCount(updatedPayload)
            }
        }
    }, [])

    const redirectDeployCardToCICD = (): string => {
        return serverMode === SERVER_MODE.FULL
            ? `${URLS.APP}/${URLS.APP_LIST}/${AppListConstants.AppType.DEVTRON_APPS}/${AppListConstants.CREATE_DEVTRON_APP_URL}`
            : `${URLS.STACK_MANAGER_DISCOVER_MODULES_DETAILS}?id=${ModuleNameMap.CICD}`
    }

    const onClickHelmChart = (e) => {
        handlePostHogEventUpdate(e, POSTHOG_EVENT_ONBOARDING.BROWSE_HELM_CHART)
    }

    const onClickCluster = (e) => {
        handlePostHogEventUpdate(e, POSTHOG_EVENT_ONBOARDING.CONNECT_CLUSTER)
    }

    const onClickedCICD = (e) => {
        if (serverMode === SERVER_MODE.FULL) {
            handlePostHogEventUpdate(e, POSTHOG_EVENT_ONBOARDING.DEPLOY_CUSTOM_APP_CI_CD)
        } else {
            handlePostHogEventUpdate(e, POSTHOG_EVENT_ONBOARDING.INSTALL_CUSTOM_CI_CD)
        }
    }

    const handleSkipOnboarding = () => {
        const updatedPayload = {
            key: POSTHOG_EVENT_ONBOARDING.SKIP_AND_EXPLORE_DEVTRON,
            value: 'true',
        }
        updateLoginCount(updatedPayload)
    }

    return (
        <div className="onboarding-container h-100">
            <GuideCommonHeader
                loginCount={loginCount}
                title="What will you use devtron for?"
                subtitle="This will help us in guiding you towards relevant product features"
                isGettingStartedClicked={isGettingStartedClicked}
            />
            <div className="bcn-0 onboarding__bottom flex dc__position-rel cn-9">
                <div className="onboarding__abs">
                    <div className="onboarding-cards__wrap">
                        <ContentCard
                            redirectTo={URLS.CHARTS_DISCOVER}
                            onClick={onClickHelmChart}
                            imgSrc={HelmCollage}
                            title="Deploy and manage your favourite Kubernetes packages"
                            linkText="Browse Helm Charts"
                            LinkIcon={ArrowRight}
                            linkIconClass="scb-5"
                            linkIconPlacement={CardLinkIconPlacement.AfterLinkApart}
                        />
                        <ContentCard
                            redirectTo={URLS.GLOBAL_CONFIG_CLUSTER}
                            onClick={onClickCluster}
                            imgSrc={HelmCluster}
                            title="Discover and manage existing helm releases via GUI"
                            linkText="Connect Kubernetes Cluster"
                            LinkIcon={ArrowRight}
                            linkIconClass="scb-5"
                            linkIconPlacement={CardLinkIconPlacement.AfterLinkApart}
                        />
                        <ContentCard
                            redirectTo={redirectDeployCardToCICD()}
                            onClick={onClickedCICD}
                            imgSrc={DeployCICD}
                            title="Deploy custom applications using CI/CD pipelines"
                            linkText={
                                serverMode === SERVER_MODE.FULL ? 'Create Application' : 'Install CI/CD Integration'
                            }
                            LinkIcon={ArrowRight}
                            linkIconClass="scb-5"
                            linkIconPlacement={CardLinkIconPlacement.AfterLinkApart}
                        />
                    </div>
                    <div className="fs-14 mt-40 mb-20 flex column">
                        <NavLink
                            to={`${URLS.APP}/${URLS.APP_LIST}`}
                            className="guide_skip dc__no-decor cb-5 fw-6 cursor mb-4"
                            data-posthog={POSTHOG_EVENT_ONBOARDING.SKIP_AND_EXPLORE_DEVTRON}
                            onClick={handleSkipOnboarding}
                        >
                            Skip and explore Devtron on your own
                        </NavLink>
                        <div className="cn-7">Tip: You can return here anytime from the Help menu in header</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
