import { processWorkflow } from '../workflow.service'
import { WorkflowTrigger, WorkflowCreate } from '../config'
import {
    ciConfigResp,
    cdConfigResp,
    cdConfigPreResp,
    cdConfigPostResp,
    cdConfigPrePostResp,
    workflow,
    workflowsCreate,
    workflowsTrigger,
    workflowsTriggerPreCDResp,
    workflowsCreatePreCDResp,
    workflowsTriggerPostCD,
    workflowsCreatePostCD,
    workflowsTriggerPrePostCD,
    workflowsCreatePrePostCD,
    cdConfigPrePostRespWithPrePostSequential,
} from './workflow.mock'

import {
    workflowsCreatePostCDWithSequential,
    workflowsCreatePreCDRespWithSequential,
    workflowsCreatePrePostCDWithSequential,
    workflowsCreateWithSequential,
    workflowsTriggerPostCDWithSequential,
    workflowsTriggerPreCDRespWithSequential,
    workflowsTriggerPrePostCDWithSequential,
    workflowsTriggerWithSequential,
    workflowWithSequential,
    workflowsTriggerPrePostCDWithPrePostSequential,
    workflowsCreatePrePostCDWithPrePostSequential,
} from './workflow.sequential.mock'
import { CdPipelineResult, CiPipelineResult, WorkflowResult } from '../types'

describe('workflow service tests', () => {
    test('process workflows no PRECD, no POSTCD', () => {
        // expect(
        //     processWorkflow(
        //         workflow.result as WorkflowResult,
        //         ciConfigResp.result as CiPipelineResult,
        //         cdConfigResp.result as CdPipelineResult,
        //         [],
        //         WorkflowTrigger,
        //         WorkflowTrigger.workflow,
        //     ).workflows,
        // ).toStrictEqual(workflowsTrigger)
        // expect(
        //     processWorkflow(
        //         workflow.result as WorkflowResult,
        //         ciConfigResp.result as CiPipelineResult,
        //         cdConfigResp.result as CdPipelineResult,
        //         [],
        //         WorkflowCreate,
        //         WorkflowCreate.workflow,
        //     ).workflows,
        // ).toStrictEqual(workflowsCreate)
    })
})
