import React from 'react'
import GitOpsConfiguration from '../GitOpsConfiguration'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'

describe('Gitopsconfiguration', () => {
    let div

    beforeAll(() => {
        div = document.createElement('div')
    })

    it('GitOpsConfiguration renders without crashing', () => {
        render(<GitOpsConfiguration handleChecklistUpdate={jest.fn()} />, { wrapper: BrowserRouter })
    })
})
