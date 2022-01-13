import React, {useState, useEffect, useContext} from 'react';
import {useLocation, useHistory, useParams} from 'react-router';
import { Link, Switch, Route } from 'react-router-dom';
import {Progressing, Filter, showError, FilterOption, Modal, ErrorScreenManager, handleUTCTime } from '../../common';
import {ReactComponent as Search} from '../../../assets/icons/ic-search.svg';
import {ReactComponent as ChartIcon} from '../../../assets/icons/ic-charts.svg';
import {ReactComponent as AddIcon} from '../../../assets/icons/ic-add.svg';
import InstallDevtronFullImage from '../../../assets/img/install-devtron-full@2x.png';
import EmptyState from '../../EmptyState/EmptyState';
import {getInitData, buildClusterVsNamespace} from './AppListService'
import {ServerErrors} from '../../../modals/commonTypes';
import {AppListViewType} from '../config';
import {URLS, AppListConstants, SERVER_MODE} from '../../../config';
import {ReactComponent as Clear} from '../../../assets/icons/ic-error.svg';
import DevtronAppListContainer from '../list/DevtronAppListContainer';
import HelmAppList from './HelmAppList';
import * as queryString from 'query-string';
import { OrderBy, SortBy } from '../list/types';
import { AddNewApp } from '../create/CreateApp';
import { mainContext } from '../../common/navigation/NavigationRoutes';
import '../list/list.css';
import EAEmptyState, { EAEmptyType } from '../../common/eaEmptyState/EAEmptyState';

export default function AppList() {
    const location = useLocation();
    const history = useHistory();
    const params = useParams<{ appType: string}>();
    const {serverMode, setPageOverflowEnabled} = useContext(mainContext);
    const [dataStateType, setDataStateType] = useState(AppListViewType.LOADING);
    const [errorResponseCode, setErrorResponseCode] = useState(0);
    const [lastDataSyncTimeString, setLastDataSyncTimeString] = useState("");
    const [lastDataSync, setLastDataSync] = useState(false);

    const [parsedPayloadOnUrlChange, setParsedPayloadOnUrlChange] = useState({});
    const [currentTab, setCurrentTab] = useState(undefined);
    const [showCreateNewAppSelectionModal, setShowCreateNewAppSelectionModal] = useState(false);

    // API master data
    const [appCheckListRes, setAppCheckListRes] = useState({});
    const [projectListRes, setProjectListRes] = useState({result : []});
    const [environmentListRes, setEnvironmentListRes] = useState({result : []});

    // search
    const [searchString, setSearchString] = useState(undefined);
    const [searchApplied, setSearchApplied] = useState(false);

    // filters
    const [masterFilters, setMasterFilters] = useState({projects : [], clusters :[], namespaces : [], environments : []});
    const [showPulsatingDot, setShowPulsatingDot] = useState<boolean>(false);
    const [fetchingExternalApps, setFetchingExternalApps] = useState(false);


    // on page load
    useEffect(() => {
        let _currentTab = params.appType == AppListConstants.AppType.DEVTRON_APPS ? AppListConstants.AppTabs.DEVTRON_APPS : AppListConstants.AppTabs.HELM_APPS;
        setCurrentTab(_currentTab);

        // set search data
        let searchQuery = location.search;
        let queryParams = queryString.parse(searchQuery);
        if (queryParams.search){
            setSearchString(queryParams.search);
            setSearchApplied(true);
        }

        // set payload parsed from url
        let payloadParsedFromUrl = onRequestUrlChange();
        setParsedPayloadOnUrlChange(payloadParsedFromUrl);

        // fetch master filters data and some master data
        getInitData(payloadParsedFromUrl, serverMode).then((initData) => {
            setAppCheckListRes(initData.appCheckListRes);
            setProjectListRes(initData.projectsRes);
            setEnvironmentListRes(initData.environmentListRes);
            setMasterFilters(initData.filters);
            applyClusterSelectionFilterOnPageLoadIfSingle(initData.filters.clusters, _currentTab);
            setDataStateType(AppListViewType.LIST);
        }).catch((errors: ServerErrors) => {
            showError(errors);
            setDataStateType(AppListViewType.ERROR);
            setErrorResponseCode(errors.code);
        })
    }, [])


    // update lasy sync time on tab change
    useEffect(() => {
        const _lastDataSyncTime = Date();
        setLastDataSyncTimeString("Last synced " +  handleUTCTime(_lastDataSyncTime, true));
        const interval = setInterval(() => {
            setLastDataSyncTimeString("Last synced " +  handleUTCTime(_lastDataSyncTime, true));
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [lastDataSync])


    useEffect(() => {
        setParsedPayloadOnUrlChange(onRequestUrlChange());
    }, [location.search])


    const applyClusterSelectionFilterOnPageLoadIfSingle = (clusterFilters : any[], currentTab : string) : void => {
        // return if not single cluster
        if(clusterFilters.length != 1) {
            return;
        }

        let _cluster = clusterFilters[0]

        // return if any cluster filter applied
        let _isAnyClusterFilterApplied = clusterFilters.some(_cluster => _cluster.isChecked);
        if(_isAnyClusterFilterApplied){
            return;
        }

        // auto check cluster
        let _filterOptions : FilterOption[] = [];
        _filterOptions.push({
            key : _cluster.key,
            label : _cluster.label,
            isSaved : _cluster.isSaved,
            isChecked : true
        })

        applyFilter(AppListConstants.FilterType.CLUTSER, _filterOptions, currentTab);
    }

    const onRequestUrlChange = () : any => {
        let searchQuery = location.search;

        let params = queryString.parse(searchQuery);
        let search = params.search || "";
        let environments = params.environment || "";
        let teams = params.team || "";
        let clustersAndNamespaces = params.namespace || "";

        let _clusterVsNamespaceMap = buildClusterVsNamespace(clustersAndNamespaces);
        let environmentsArr = environments.toString().split(",").map(env => +env).filter(item => item != 0);
        let teamsArr = teams.toString().split(",").filter(team => team != '').map(team => Number(team));

        ////// update master filters data (check/uncheck)
        let filterApplied = {
            environments: new Set(environmentsArr),
            teams: new Set(teamsArr),
            clusterVsNamespaceMap : _clusterVsNamespaceMap
        }

        let _masterFilters = {projects :[], clusters :[], namespaces :[], environments : []};

        // set projects (check/uncheck)
        _masterFilters.projects = masterFilters.projects.map((project) => {
            return {
                key: project.key,
                label: project.label,
                isSaved: true,
                isChecked: filterApplied.teams.has(project.key)
            }
        })

        // set clusters (check/uncheck)
        _masterFilters.clusters = masterFilters.clusters.map((cluster) => {
            return {
                key: cluster.key,
                label: cluster.label,
                isSaved: true,
                isChecked: filterApplied.clusterVsNamespaceMap.has(cluster.key.toString())
            }
        })

        // set namespace (check/uncheck)
        _masterFilters.namespaces = masterFilters.namespaces.map((namespace) => {
            return {
                key: namespace.key,
                label: namespace.label,
                isSaved: true,
                isChecked: filterApplied.clusterVsNamespaceMap.has(namespace.clusterId.toString()) && filterApplied.clusterVsNamespaceMap.get(namespace.clusterId.toString()).includes(namespace.key.split("_")[1]),
                toShow : filterApplied.clusterVsNamespaceMap.size == 0 || filterApplied.clusterVsNamespaceMap.has(namespace.clusterId.toString()),
                actualName: namespace.actualName,
                clusterName : namespace.clusterName,
                clusterId : namespace.clusterId
            }
        })

        // set environments (check/uncheck)
        _masterFilters.environments = masterFilters.environments.map((env) => {
            return {
                key: env.key,
                label: env.label,
                isSaved: true,
                isChecked: filterApplied.environments.has(env.key)
            }
        })
        setMasterFilters(_masterFilters);
        ////// update master filters data ends (check/uncheck)


        let sortBy = params.orderBy || SortBy.APP_NAME;
        let sortOrder = params.sortOrder || OrderBy.ASC;
        let offset = +params.offset || 0;
        let pageSize: number = +params.pageSize || 20;
        let pageSizes = new Set([20, 40, 50]);

        if (!pageSizes.has(pageSize)) { //handle invalid pageSize
            pageSize = 20;
        }
        if ((offset % pageSize != 0)) { //pageSize must be a multiple of offset
            offset = 0;
        }

        let payload = {
            environments: environmentsArr,
            teams: teamsArr,
            namespaces : clustersAndNamespaces.toString().split(",").filter(item => item != ""),
            appNameSearch: search,
            sortBy: sortBy,
            sortOrder: sortOrder,
            offset: offset,
            size: +pageSize,
        }
        return payload;
    }

    const buildDevtronAppListUrl = () : string => {
        return `${URLS.APP}/${URLS.APP_LIST}/${URLS.APP_LIST_DEVTRON}`;
    }

    const buildHelmAppListUrl = () : string => {
        return `${URLS.APP}/${URLS.APP_LIST}/${URLS.APP_LIST_HELM}`;
    }

    function openDevtronAppCreateModel(event: React.MouseEvent) {
        let url = `${buildDevtronAppListUrl()}/${AppListConstants.CREATE_APP_URL}${location.search}`
        history.push(`${url}`);
    }

    function redirectToHelmAppDiscover(event: React.MouseEvent) {
        let url = `${URLS.CHARTS_DISCOVER}`
        history.push(`${url}`);
    }

    const redirectToAppDetails = (appId : string | number, envId: number): string => {
        if (envId) {
            return `/app/${appId}/details/${envId}`;
        }
        return `/app/${appId}/trigger`;
    }

    const updateLastDataSync = () : void => {
        setLastDataSync(!lastDataSync);
    }

    const handleAppSearchOperation = (_searchString : string): void => {
        let qs = queryString.parse(location.search);
        let keys = Object.keys(qs);
        let query = {};
        keys.map((key) => {
            query[key] = qs[key];
        })
        if (_searchString){
            query['search'] = _searchString;
            query['offset'] = 0;
        }else{
            delete query['search'];
            delete query['offset'];
        }

        let queryStr = queryString.stringify(query);
        let url = `${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? buildDevtronAppListUrl() : buildHelmAppListUrl()}?${queryStr}`;
        history.push(url);
    }

    const applyFilter = (type: string, list: FilterOption[], selectedAppTab : string = undefined): void => {
        let qs = queryString.parse(location.search);
        let keys = Object.keys(qs);
        let query = {};
        keys.map((key) => {
            query[key] = qs[key];
        })

        let queryParamType = (type == AppListConstants.FilterType.CLUTSER || type == AppListConstants.FilterType.NAMESPACE) ? 'namespace' : type;
        let checkedItems = list.filter(item => item.isChecked);
        let ids = checkedItems.map(item => item.key);
        let str = ids.toString();
        query[queryParamType] = str;
        query['offset'] = 0;
        let queryStr = queryString.stringify(query);
        let _currentTab = selectedAppTab || currentTab;
        let url = `${_currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? buildDevtronAppListUrl() : buildHelmAppListUrl()}?${queryStr}`;
        history.push(url);
    }

    const removeFilter = (filter, filterType: string): void => {
        let val = filter.key;
        let qs = queryString.parse(location.search);
        let keys = Object.keys(qs);
        let query = {};
        keys.map((key) => {
            query[key] = qs[key];
        })
        query['offset'] = 0;
        let queryParamType = (filterType == AppListConstants.FilterType.CLUTSER || filterType == AppListConstants.FilterType.NAMESPACE) ? 'namespace' : filterType;
        let appliedFilters = query[queryParamType];
        let arr = appliedFilters.split(",");
        if(filterType == AppListConstants.FilterType.CLUTSER) {
            arr = arr.filter((item) => !item.startsWith(val.toString()));
        }else{
            arr = arr.filter((item) => item != val.toString());
        }
        query[queryParamType] = arr.toString();
        if (query[queryParamType] == "") delete query[queryParamType];
        let queryStr = queryString.stringify(query);
        let url = `${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? buildDevtronAppListUrl() : buildHelmAppListUrl()}?${queryStr}`;
        history.push(url);
    }

    const removeAllFilters = (): void => {
        let qs = queryString.parse(location.search);
        let keys = Object.keys(qs);
        let query = {};
        keys.map((key) => {
            query[key] = qs[key];
        })
        delete query['environment'];
        delete query['team'];
        delete query['namespace'];
        delete query['search'];

        //delete search string
        setSearchApplied(false);
        setSearchString("");

        let queryStr = queryString.stringify(query);
        let url = `${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? buildDevtronAppListUrl() : buildHelmAppListUrl()}?${queryStr}`;
        history.push(url);
    }

    const sortApplicationList = (key: string): void => {
        let qs = queryString.parse(location.search);
        let keys = Object.keys(qs);
        let query = {};
        keys.map((key) => {
            query[key] = qs[key];
        })
        query["orderBy"] = key;
        query["sortOrder"] = query["sortOrder"] == OrderBy.ASC ? OrderBy.DESC : OrderBy.ASC;
        let queryStr = queryString.stringify(query);
        let url = `${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? buildDevtronAppListUrl() : buildHelmAppListUrl()}?${queryStr}`;
        history.push(url);
    }

    function changeAppTab(appTabType) {
        if (appTabType == currentTab){
            return;
        }
        let url = (appTabType == AppListConstants.AppTabs.DEVTRON_APPS) ? `${buildDevtronAppListUrl()}${location.search}` : `${buildHelmAppListUrl()}${location.search}`;
        history.push(url);
        setCurrentTab(appTabType);
    }

    const searchApp = (event: React.FormEvent) => {
        event.preventDefault();
        setSearchApplied(true);
        handleAppSearchOperation(searchString);
    }

    const clearSearch = (): void => {
        setSearchApplied(false);
        setSearchString("");
        handleAppSearchOperation("");
    }

    const onChangeSearchString = (event: React.ChangeEvent<HTMLInputElement>): void => {
        let str = event.target.value || "";
        str = str.toLowerCase();
        setSearchString(str);
    }

    const syncNow = () : void => {
        window.location.reload();
    }

    const setFetchingExternalAppsState = (fetching : boolean) : void => {
        setFetchingExternalApps(fetching);
    }

    const setShowPulsatingDotState = (show : boolean) : void => {
        setShowPulsatingDot(show);
    }

    const onShowHideFilterContent = (show : boolean) : void => {
        setPageOverflowEnabled(!show);
    }

    function renderPageHeader() {
        return <div className="app-header__title">
                <h1 className="app-header__text">Applications</h1>
                {serverMode == SERVER_MODE.FULL &&
                    <button type="button" className="cta h-32 lh-n"
                            onClick={() => setShowCreateNewAppSelectionModal(!showCreateNewAppSelectionModal)}>
                        Create new
                        <span className="round-button__icon"><i className="fa fa-caret-down" aria-hidden="true"></i></span>
                    </button>
                }
                {showCreateNewAppSelectionModal && renderAppCreateSelectionModal()}
            </div>
    }

    function renderMasterFilters() {
        let _isAnyClusterFilterApplied = masterFilters.clusters.some(_cluster => _cluster.isChecked);
        return <div className="search-filter-section">
                    <form style={{ display: "inline" }} onSubmit={searchApp}>
                       <div className="search">
                            <Search className="search__icon icon-dim-18"/>
                            <input type="text" name="app_search_input" autoComplete="off" value={searchString} placeholder={`${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? 'Search by app name' : 'Search by app or chart name'}`} className="search__input bcn-1" onChange={onChangeSearchString} />
                            {searchApplied &&
                                <button className="search__clear-button" type="button" onClick={clearSearch}>
                                    <Clear className="icon-dim-18 icon-n4 vertical-align-middle"/>
                                </button>
                            }
                        </div>
                    </form>
                <div className="filters">
                    <span className="filters__label">Filter By</span>
                    <Filter list={masterFilters.projects}
                            labelKey="label"
                            buttonText="Projects"
                            placeholder="Search Project"
                            searchable multi
                            type={AppListConstants.FilterType.PROJECT}
                            applyFilter={applyFilter}
                            onShowHideFilterContent={onShowHideFilterContent} />
                    <span className="filter-divider"></span>
                    <Filter list={masterFilters.clusters}
                            labelKey="label"
                            buttonText="Cluster"
                            searchable multi
                            placeholder="Search Cluster"
                            type={AppListConstants.FilterType.CLUTSER}
                            applyFilter={applyFilter}
                            onShowHideFilterContent={onShowHideFilterContent}
                            showPulsatingDot={showPulsatingDot}/>
                    <Filter list={masterFilters.namespaces.filter(namespace => namespace.toShow)}
                            labelKey="label"
                            buttonText="Namespace"
                            searchable multi
                            placeholder="Search Namespace"
                            type={AppListConstants.FilterType.NAMESPACE}
                            applyFilter={applyFilter}
                            isDisabled={!_isAnyClusterFilterApplied}
                            disableTooltipMessage={"Select a cluster first"}
                            isLabelHtml={true}
                            onShowHideFilterContent={onShowHideFilterContent} />
                    {
                        serverMode == SERVER_MODE.FULL &&
                        <>
                            <span className="filter-divider"></span>
                            <Filter list={masterFilters.environments}
                                    labelKey="label"
                                    buttonText="Environment"
                                    searchable multi
                                    placeholder="Search Environment"
                                    type={AppListConstants.FilterType.ENVIRONMENT}
                                    applyFilter={applyFilter}
                                    onShowHideFilterContent={onShowHideFilterContent} />
                        </>
                    }
                </div>
            </div>
    }

    function renderAppliedFilters() {
        let count = 0;
        let keys = Object.keys(masterFilters);
        let appliedFilters = <div className="saved-filters__wrap position-rel">
            {keys.map((key) => {
                let filterType = '';
                let _filterKey = '';
                if (key == 'projects'){
                    filterType = AppListConstants.FilterType.PROJECT;
                    _filterKey = 'project';
                }else if (key == 'clusters'){
                    filterType = AppListConstants.FilterType.CLUTSER;
                    _filterKey = 'cluster';
                }else if (key == 'namespaces'){
                    filterType = AppListConstants.FilterType.NAMESPACE;
                    _filterKey = 'namespace';
                }else if (key == 'environments'){
                    filterType = AppListConstants.FilterType.ENVIRONMENT;
                    _filterKey = 'environment';
                }
                return masterFilters[key].map((filter) => {
                    if (filter.isChecked) {
                        count++;
                        let _text = (filterType == AppListConstants.FilterType.NAMESPACE) ? filter.actualName + ' (' + filter.clusterName + ')' : filter.label;
                        return <div key={filter.key} className="saved-filter">
                            <span className="fw-6 mr-5">{_filterKey}</span>
                            <span className="saved-filter-divider"></span>
                            <span className="ml-5">{_text}</span>
                            <button type="button" className="saved-filter__close-btn"
                                    onClick={(event) => removeFilter(filter, filterType)} >
                                <i className="fa fa-times-circle" aria-hidden="true"></i>
                            </button>
                        </div>
                    }
                })
            })}
            <button type="button" className="saved-filters__clear-btn fs-13" onClick={() => { removeAllFilters() }}>
                Clear All Filters
            </button>
        </div>

        return <React.Fragment>
            {count > 0 ? appliedFilters : null}
        </React.Fragment>
    }

    function renderAppTabs() {
        return <div className="app-tabs-wrapper">
            <ul className="tab-list">
                <li className="tab-list__tab">
                    <a className={`tab-list__tab-link ${currentTab == AppListConstants.AppTabs.DEVTRON_APPS ? 'active' : ''}`}
                       onClick={() => changeAppTab(AppListConstants.AppTabs.DEVTRON_APPS)}>Devtron Apps</a>
                </li>
                <li className="tab-list__tab">
                    <a className={`tab-list__tab-link ${currentTab == AppListConstants.AppTabs.HELM_APPS ? 'active' : ''}`}
                       onClick={() => changeAppTab(AppListConstants.AppTabs.HELM_APPS)}>Helm Apps</a>
                </li>
            </ul>
            <div className="app-tabs-sync">
                {
                    lastDataSyncTimeString && ((params.appType == AppListConstants.AppType.DEVTRON_APPS) || (params.appType == AppListConstants.AppType.HELM_APPS && !fetchingExternalApps)) &&
                    <span>{lastDataSyncTimeString} <button className="btn btn-link p-0 fw-6 cb-5" onClick={syncNow}>Sync now</button></span>
                }
                {
                    params.appType == AppListConstants.AppType.HELM_APPS && fetchingExternalApps &&
                    <div className="flex left">
                        <span className="mr-10">
                            <Progressing />
                        </span>
                        <span>Fetching apps...</span>
                    </div>
                }
            </div>
        </div>
    }

    const closeDevtronAppCreateModal = () => {
        let url = `${buildDevtronAppListUrl()}${location.search}`;
        history.push(`${url}`);
    }

    function renderAppCreateRouter() {
        return <Switch>
            <Route path={`${buildDevtronAppListUrl()}/${AppListConstants.CREATE_APP_URL}`}
                   render={(props) => <AddNewApp close={closeDevtronAppCreateModal}  match={props.match} location={props.location} history={props.history} />}
            />
        </Switch>
    }

    function renderAppCreateSelectionModal() {
        return <Modal rootClassName="app-create-model-wrapper" onClick={ () => setShowCreateNewAppSelectionModal(!showCreateNewAppSelectionModal)} >
                <div className="app-create-child c-pointer" onClick={openDevtronAppCreateModel}>
                    <AddIcon className="icon-dim-20 fcn-9"/>
                    <div className="ml-8">
                        <strong>Custom app</strong>
                        <div>Connect a git repository to deploy <br/> a custom application</div>
                    </div>
                </div>
                <div className="app-create-child c-pointer" onClick={redirectToHelmAppDiscover}>
                    <ChartIcon className="icon-dim-20"/>
                    <div className="ml-8">
                        <strong>From Chart store</strong>
                        <div>Deploy apps using third party helm <br/> charts (eg. prometheus, redis etc.)</div>
                    </div>
                </div>
        </Modal>
    }

    const knowMoreHandler = () => {
    }

    const checkInstallHandler = () =>{

    }

    return (
        <div>
            {
                dataStateType == AppListViewType.LOADING &&
                <div className="loading-wrapper">
                    <Progressing pageLoader/>
                </div>
            }
            {
                dataStateType == AppListViewType.ERROR &&
                <div className="loading-wrapper">
                    <ErrorScreenManager code={errorResponseCode} />
                </div>
            }
            {
                dataStateType == AppListViewType.LIST &&
                 <>
                    <div className="app-header">
                        {renderPageHeader()}
                    </div>
                    {renderMasterFilters()}
                    {renderAppliedFilters()}
                    {renderAppTabs()}
                    {serverMode == SERVER_MODE.FULL && renderAppCreateRouter()}
                    {
                        params.appType == AppListConstants.AppType.DEVTRON_APPS && serverMode == SERVER_MODE.FULL &&
                        <DevtronAppListContainer payloadParsedFromUrl={parsedPayloadOnUrlChange} appCheckListRes={appCheckListRes} clearAllFilters={removeAllFilters} sortApplicationList={sortApplicationList} updateLastDataSync={updateLastDataSync}/>
                    }
                    {
                        params.appType == AppListConstants.AppType.DEVTRON_APPS && serverMode == SERVER_MODE.EA_ONLY &&
                        <div style={{ height: "calc(100vh - 250px)" }}>
                            <EAEmptyState 
                            title={'Create, build, deploy and debug custom apps'} 
                            msg={'Create custom application by connecting your code repository. Build and deploy images at the click of a button. Debug your applications using the interactive UI.'} 
                            img={EAEmptyType.DEVTRONAPPS} 
                            knowMoreHandler={knowMoreHandler}
                            checkInstallHandler={checkInstallHandler}
                            />
                        </div>
                    }
                    {
                        params.appType == AppListConstants.AppType.HELM_APPS &&
                        <HelmAppList serverMode={serverMode} payloadParsedFromUrl={parsedPayloadOnUrlChange} sortApplicationList={sortApplicationList} clearAllFilters={removeAllFilters} setFetchingExternalAppsState={setFetchingExternalAppsState} updateLastDataSync={updateLastDataSync} setShowPulsatingDotState={setShowPulsatingDotState}/>
                    }
                 </>
            }
        </div>
    )
}