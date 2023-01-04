import React from 'react'
import EmptyState from '../../EmptyState/EmptyState'
import emptyCustomChart from '../../../assets/img/empty-noresult@2x.png'
import { ResourceListEmptyStateType } from '../Types'

export default function ResourceListEmptyState({
    imgSource,
    title,
    subTitle,
    actionHandler,
}: ResourceListEmptyStateType) {
    return (
        <EmptyState>
            <EmptyState.Image>
                <img src={imgSource || emptyCustomChart} alt="No resources found" />
            </EmptyState.Image>
            <EmptyState.Title>
                <h4 className="title">{title || 'No resources found'}</h4>
            </EmptyState.Title>
            <EmptyState.Subtitle>{subTitle}</EmptyState.Subtitle>
            {actionHandler && (
                <EmptyState.Button>
                    <button onClick={actionHandler} className="add-link cta flex">
                        Clear filters
                    </button>
                </EmptyState.Button>
            )}
        </EmptyState>
    )
}
