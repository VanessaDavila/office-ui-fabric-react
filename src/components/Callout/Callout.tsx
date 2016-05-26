import * as React from 'react';
import { ICalloutProps } from './Callout.Props';
import { DirectionalHint } from '../../common/DirectionalHint';
import { Layer } from '../../Layer';
import { css } from '../../utilities/css';
import { EventGroup } from '../../utilities/eventGroup/EventGroup';
import { getRelativePositions, IPositionInfo } from '../../utilities/positioning';
import './Callout.scss';

const BEAK_ORIGIN_POSITION = { top: 0, left: 0 };
const OFF_SCREEN_POSITION = { top: 0, left: -9999 };

export interface ICalloutState {
  positions?: any;
  slideDirectionalClassName?: string;
  calloutElementRect?: ClientRect;
}

export class Callout extends React.Component<ICalloutProps, ICalloutState> {

  public static defaultProps = {
    isBeakVisible: true,
    beakStyle: 'ms-Callout-beak',
    beakWidth: 28,
    gapSpace: 10,
    directionalHint: DirectionalHint.rightCenter
  };

  private _hostElement: HTMLDivElement;
  private _calloutElement: HTMLDivElement;
  private _events: EventGroup;

  constructor(props: ICalloutProps) {
    super(props);

    this.state = {
      positions: null,
      slideDirectionalClassName: null,
      calloutElementRect: null
    };

    this._events = new EventGroup(this);

    this._updatePosition = this._updatePosition.bind(this);
  }

  public componentDidUpdate() {
    this._updatePosition();
  }

  public componentWillUnmount() {
    this._events.dispose();
  }

  public render() {
    let { className, targetElement, isBeakVisible, beakStyle, children } = this.props;
    let { positions, slideDirectionalClassName } = this.state;

    return (
      <Layer onLayerMounted={ this._updatePosition }>
        <div ref={ (host: HTMLDivElement) => this._hostElement = host } className={ css('ms-Callout-container', className) }>
          <div
            className= { 'ms-Callout' + ((slideDirectionalClassName) ? (` ms-u-${slideDirectionalClassName}`) : '') }
            style={ ((positions) ? positions.callout : OFF_SCREEN_POSITION) }
            >
            { isBeakVisible && targetElement ? (<div className={ beakStyle }  style={ ((positions) ? positions.beak : BEAK_ORIGIN_POSITION) } />) : (null) }
            <div className='ms-Callout-main' ref={ (callout: HTMLDivElement) => this._calloutElement = callout }>
                { children }
            </div>
          </div>
        </div>
      </Layer>
    );
  }

  public dismiss() {
    let { onDismiss } = this.props;

    if (onDismiss) {
      onDismiss();
    }
  }

  private _dismissOnLostFocus(ev: Event) {
    let { targetElement } = this.props;
    let target = ev.target as HTMLElement;

    if (!this._hostElement.contains(target) &&
        (!targetElement || !targetElement.contains(target))) {
      this.dismiss();
    }
  }

  private _updatePosition() {
    let { positions } = this.state;
    let hostElement: HTMLElement = this._hostElement;
    let calloutElement: HTMLElement = this._calloutElement;

    this._events.on(window, 'scroll', this.dismiss, true);
    this._events.on(window, 'resize', this.dismiss, true);
    this._events.on(window, 'focus', this._dismissOnLostFocus, true);
    this._events.on(window, 'click', this._dismissOnLostFocus, true);

    if (hostElement && calloutElement) {
      let positionInfo: IPositionInfo = getRelativePositions(this.props, hostElement, calloutElement);

      // Set the new position only when the positions are not exists or one of the new callout positions are different
      if ((!positions && positionInfo) ||
        (positions && positionInfo && (positions.callout.top !== positionInfo.calloutPosition.top || positions.callout.left !== positionInfo.calloutPosition.left))) {
        this.setState({
          positions: {
            callout: positionInfo.calloutPosition,
            beak: positionInfo.beakPosition,
          },
          slideDirectionalClassName: positionInfo.directionalClassName
        });
      }
    }
    if (this.props.onLayerMounted) {
      this.props.onLayerMounted();
    }
  }
}
