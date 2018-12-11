import * as React from 'react';
import './app-root.scss';
import {connect} from 'react-redux';
import {State} from 'src/models';
import {Dispatch} from 'redux';
import {CompCasesLoad, loadCompCases, COMP_CASES_LOAD, CompCasesImageDataLoad, onCompCaseImgDataLoad, Action, COMP_CASES_IMAGE_DATA_LOAD, ScatterplotLoad, onLoadScatterplot, SCATTERPLOT_LOAD} from '../actions';
import {renderScatterplot} from './visualizations/scatterplots';
import {ScatterplotCase, CompareCase, DEFAULT_SCATTERPLOT_CASE, ScatterPlot, DEFAULT_SCATTERPLOT} from 'src/models/dataset';
import {DATASET_ECOLI} from 'src/datasets/ecoli';
import {randint} from 'src/useful-factory/utils';
import {CHART_TOTAL_SIZE} from 'src/useful-factory/constants';
import {renderScagSimMatrix} from './visualizations/heatmap-matrix';

export interface AppRootProps {
  chartPairList: CompareCase[];
  scatterplots: ScatterPlot[];

  onCompCasesLoad: (action: CompCasesLoad) => void;
  onCompCaseImgDataLoad: (action: CompCasesImageDataLoad) => void;
  onLoadScatterplot: (action: ScatterplotLoad) => void;
}

export class AppRootBase extends React.PureComponent<AppRootProps, {}> {
  constructor(props: AppRootProps) {
    super(props);

    /// Test: data for matrix
    let data2use = DATASET_ECOLI; // TODO: put to state
    let numOfFieldPairs = 3;
    let scatterplots: ScatterPlot[] = [];
    for (let i = 0; i < numOfFieldPairs; i++) {
      scatterplots.push({
        ...DEFAULT_SCATTERPLOT,
        fieldPair: {
          d: data2use.rawData,
          f1: data2use.fields[randint(1, 5)],
          f2: data2use.fields[randint(1, 5)]
        }
      })
    }
    this.props.onLoadScatterplot({
      type: SCATTERPLOT_LOAD,
      payload: scatterplots
    });
    ///
    /// Test: data for scatterplot pair list
    let chartPairList: ScatterplotCase[] = [];
    const numOfPairs = 10;
    for (let i = 0; i < numOfPairs; i++) {
      let newCase: ScatterplotCase = {
        ...DEFAULT_SCATTERPLOT_CASE,
        id: i,
        name: 'Different Fields',
        chartPair: [
          {
            d: data2use.rawData,
            f1: data2use.fields[randint(1, 5)],
            f2: data2use.fields[randint(1, 5)]
          }, {
            d: data2use.rawData,
            f1: data2use.fields[randint(1, 5)],
            f2: data2use.fields[randint(1, 5)]
          }]
      }
      chartPairList.push(newCase);
    }
    this.props.onCompCasesLoad({
      type: COMP_CASES_LOAD,
      payload: chartPairList
    });
    ///
  }

  public componentDidMount() {
  }

  public componentDidUpdate() {
  }

  render() {
    const Results = this.props.chartPairList.map(this.renderResult, this);
    let onPreviewRef = (ref: SVGSVGElement) => {
      if (ref == null) return;
      renderScatterplot(ref, {
        d: DATASET_ECOLI.rawData,
        f1: DATASET_ECOLI.fields[1],
        f2: DATASET_ECOLI.fields[2]
      })
    }
    let onScagMatrixRef = (ref: SVGSVGElement) => {
      if (ref == null) null;
      renderScagSimMatrix(ref, this.props.scatterplots);
    }
    return (
      <div className='app-root'>
        <div className='header'>( vis-diff )</div>
        <div className='main-pane'>
          <h1>Design</h1>
          <div className='result-group test'>
            <div className='chart'>
              <h2>Preview</h2>
              <svg ref={onPreviewRef}></svg>
            </div>
            <div className='chart'>
              <h2>Configure</h2>
              <div className='option-panel'></div>
            </div>
          </div>
          <h1>Scatterplot Similarity</h1>
          <div><svg ref={onScagMatrixRef}></svg></div>
          <h1>Scatterplot Pairs</h1>
          {Results}
          {/* canvas2img. this should be invisible to users */}
          <div hidden>
            <div className='result-group test'>
              <div className='chart'><canvas id='canvas' width={CHART_TOTAL_SIZE.width} height={CHART_TOTAL_SIZE.height}></canvas></div>
              <div className='chart'><img id='testimg'></img></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderResult(cc: CompareCase) {
    let onRefA = (ref: SVGSVGElement) => {
      if (ref == null || cc.imgDataPair.A.length != 0) return;
      this.props.onCompCaseImgDataLoad({
        type: COMP_CASES_IMAGE_DATA_LOAD,
        payload: {
          index: cc.id,
          pairIndex: 'A',
          imgData: renderScatterplot(ref, cc.chartPair[0], {noGridAxis: true})
        }
      })
    }
    let onRefB = (ref: SVGSVGElement) => {
      if (ref == null || cc.imgDataPair.B.length != 0) return;
      this.props.onCompCaseImgDataLoad({
        type: COMP_CASES_IMAGE_DATA_LOAD,
        payload: {
          index: cc.id,
          pairIndex: 'B',
          imgData: renderScatterplot(ref, cc.chartPair[1], {noGridAxis: true})
        }
      })
    }
    return (
      <div key={cc.id}>
        <h3>{cc.name}</h3>
        <div className='result-group'>
          <div className='chart'><svg id={cc.id + 'A'} ref={onRefA}></svg></div>
          <div className='chart'><svg id={cc.id + 'B'} ref={onRefB}></svg></div>
          <div className='score'>
            SSIM: {cc.scores.ssim.toFixed(2)}
          </div>
        </div>
      </div>
    );
  }
}

export const AppRoot = connect(
  (state: State) => {
    return {
      chartPairList: state.persistent.chartPairList,
      scatterplots: state.persistent.scatterplots
    };
  },
  (dispatch: Dispatch<Action>) => {
    return {
      onCompCasesLoad: (action: CompCasesLoad) => dispatch(loadCompCases(action)),
      onCompCaseImgDataLoad: (action: CompCasesImageDataLoad) => dispatch(onCompCaseImgDataLoad(action)),
      onLoadScatterplot: (action: ScatterplotLoad) => dispatch(onLoadScatterplot(action))
    }
  }
)(AppRootBase);