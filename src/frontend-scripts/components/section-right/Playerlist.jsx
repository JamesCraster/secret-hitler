import React from 'react';
import { connect } from 'react-redux';
import {ADMINS, PLAYERCOLORS} from '../../constants';
import $ from 'jquery';
import Modal from 'semantic-ui-modal';
import classnames from 'classnames';

$.fn.modal = Modal;

const	mapStateToProps = ({ midSection }) => ({ midSection }),
	mergeProps = (stateProps, dispatchProps, ownProps) => {
		const isUserClickable = stateProps.midSection !== 'game';

		return Object.assign({}, ownProps, { isUserClickable });
	};

class Playerlist extends React.Component {
	constructor() {
		super();
		this.clickInfoIcon = this.clickInfoIcon.bind(this);
		this.state = {
			userListFilter: 'all'
		};
	}

	clickInfoIcon() {
		$('.playerlistinfo')
			.modal('setting', 'transition', 'scale')
			.modal('show');
	}

	routeToGame(gameId) {
		this.props.socket.emit('getGameInfo', gameId);
	}

	renderFilterIcons() {
		const filterClick = filter => {
			this.setState({userListFilter: this.state.userListFilter === 'all' ? 'rainbow' : 'all'});
		};

		return (
			<span className="filter-container">
				<span className={this.state.userListFilter} onClick={filterClick} />
			</span>
		);
	}

	render() {
		return (
			<section className="playerlist">
				<div className="playerlist-header">
					<div className="clearfix">
						<h3 className="ui header">Lobby</h3>
						<i className="info circle icon" onClick={this.clickInfoIcon} />
						{this.renderFilterIcons()}
						<div className="ui basic modal playerlistinfo">
							<div className="header">Lobby and player color info</div>
							<h4>Players in the lobby, general chat, and game chat are grey/white until:</h4>
							<p>50 games played: <span className="experienced">light green</span></p>
							<p>100 games played: <span className="veryexperienced">darker green</span></p>
							<p>200 games played: <span className="veryveryexperienced">even darker green</span></p>
							<p>300 games played: <span className="superexperienced">even darker green</span></p>
							<p>500 games played: <span className="supersuperexperienced">really dark green</span></p>
							<h4>Additionally, if a player has at least 50 games played and a win rate of</h4>
							<p>greater than 55%: <span className="sortaonfire experienced">light purple</span></p>
							<p>greater than 60%: <span className="onfire experienced">darker purple</span></p>
							<p>greater than 65%: <span className="veryonfire experienced">really dark purple</span></p>
							<h4>Also <span className="admin">admins</span> are always on top, and <span className="contributer">contributers</span> get a special color as well</h4>
						</div>
						{(() => {
							if (Object.keys(this.props.userList).length) {
								return (
									<div>
										<span>{this.props.userList.list.length}</span>
										<i className="large user icon" />
										<span>{this.props.userList.totalSockets - this.props.userList.list.length >= 0 ? this.props.userList.totalSockets - this.props.userList.list.length : 0}</span>
										<i className="large unhide icon" />
									</div>
								);
							}
						})()}
					</div>
				</div>
				<div className="playerlist-body">
					{(() => {
						if (Object.keys(this.props.userList).length) {
							const {list} = this.props.userList,
								w = this.state.userListFilter === 'all' ? 'wins' : 'rainbowWins',
								l = this.state.userListFilter === 'all' ? 'losses' : 'rainbowLosses';

							list.sort((a, b) => {
								const aTotal = a[w] + a[l],
									bTotal = b[w] + b[l];

								if (ADMINS.includes(a.userName)) {
									return -1;
								}

								if (ADMINS.includes(b.userName)) {
									return 1;
								}

								if (aTotal > 49 && bTotal > 49) {
									return (b[w] / bTotal) - (a[w] / aTotal);
								} else if (aTotal > 49) {
									return -1;
								} else if (bTotal > 49) {
									return 1;
								}

								return b[w] - a[w];
							});

							return list.filter(player => this.state.userListFilter === 'all' || player.wins + player.losses > 49).map((user, i) => {
								const percent = ((user[w] / (user[w] + user[l])) * 100).toFixed(0),

									percentDisplay = (user[w] + user[l]) > 9 ? `${percent}%` : '',

									disableIfUnclickable = f => {
										if (this.props.isUserClickable)
											return f;

										return () => null;
									},

									renderStatus = () => {
										const status = user.status;

										if (!status || status === 'none') {
											return null;
										} else {
											const iconClasses = classnames(
												'status',
												{ unclickable: !this.props.isUserClickable },
												{ search: status.type === 'observing' },
												{ fav: status.type === 'playing' },
												{ rainbow: status.type === 'rainbow' },
												'icon'
											);

											return (
												<i
													className={iconClasses}
													onClick={disableIfUnclickable(this.routeToGame).bind(this, status.gameId)} />
											);
										}
									};

								return (
									<div key={i}>
										<span className={PLAYERCOLORS(user)}>{user.userName}</span>
										{renderStatus()}
										{(() => {
											if (!ADMINS.includes(user.userName)) {
												const w = this.state.userListFilter === 'all' ? 'wins' : 'rainbowWins',
													l = this.state.userListFilter === 'all' ? 'losses' : 'rainbowLosses';

												return (
													<div className="userlist-stats-container">(
														<span className="userlist-stats">{user[w]}</span> / <span className="userlist-stats">{user[l]}</span>) <span className="userlist-stats"> {percentDisplay}</span>
													</div>
												);
											}
										})()}
									</div>
								);
							});
						}
					})()}
				</div>
			</section>
		);
	}
}

Playerlist.propTypes = {
	userList: React.PropTypes.object
};

export default connect(
	mapStateToProps,
	null,
	mergeProps
)(Playerlist);