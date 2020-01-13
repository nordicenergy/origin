import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Role } from '@energyweb/user-registry';
import logo from '../../assets/logo.svg';
import './Header.scss';
import { useSelector, useDispatch } from 'react-redux';
import { useLinks } from '../utils/routing';
import { getUserById, getUsers, getCurrentUser } from '../features/users/selectors';
import {
    isUsingInBrowserPK,
    getAccounts,
    getActiveAccount,
    getEncryptedAccounts
} from '../features/authentication/selectors';
import {
    makeStyles,
    createStyles,
    useTheme,
    Select,
    MenuItem,
    FilledInput,
    Tooltip
} from '@material-ui/core';
import { AccountCircle, VpnKeySharp, Lock, Settings, PersonAdd } from '@material-ui/icons';
import { requestUser } from '../features/users/actions';
import { setActiveAccount, unlockAccount } from '../features/authentication/actions';
import { showRequestPasswordModal } from '../features/general/actions';
import { dataTest } from '../utils/helper';

const useStyles = makeStyles(() =>
    createStyles({
        icon: {
            opacity: 0.3,
            fontSize: '16px',
            marginLeft: '8px'
        },
        endIcon: {
            opacity: 0.7,
            fontSize: '16px',
            marginLeft: '8px'
        }
    })
);

export function Header() {
    const isUsingPK = useSelector(isUsingInBrowserPK);
    const accounts = useSelector(getAccounts);
    const users = useSelector(getUsers);
    const encryptedAccounts = useSelector(getEncryptedAccounts);
    const currentUser = useSelector(getCurrentUser);

    const isIssuer = currentUser?.isRole(Role.Issuer);

    let activeAccount = useSelector(getActiveAccount);

    const dispatch = useDispatch();

    const classes = useStyles(useTheme());

    const {
        getDevicesLink,
        getUserRegisterLink,
        getCertificatesLink,
        getDemandsLink,
        getAccountLink
    } = useLinks();

    const privateKeyIndicator = <VpnKeySharp className={classes.icon} />;

    const selectorAccounts = accounts.map(a => {
        const user = getUserById(users, a.address);

        if (!user) {
            dispatch(requestUser(a.address));
        }

        return {
            id: `${a.address}${a.privateKey ? 'PK' : ''}`,
            value: a.address,
            label: user?.organization || 'Guest',
            isPrivateKey: Boolean(a.privateKey),
            isLocked: false
        };
    });

    encryptedAccounts.map(a => {
        if (
            selectorAccounts.find(
                selectorAccount =>
                    selectorAccount.value === a.address && selectorAccount.isPrivateKey === true
            )
        ) {
            return;
        }

        const user = getUserById(users, a.address);

        if (!user) {
            dispatch(requestUser(a.address));
        }

        selectorAccounts.push({
            id: `${a.address}PK`,
            value: a.address,
            label: user?.organization || 'Guest',
            isPrivateKey: true,
            isLocked: true
        });
    });

    const handleChange = (id: string) => {
        const selectedAccount = selectorAccounts.find(a => a.id === id);
        const address = id.includes('PK') ? id.slice(0, id.length - 2) : id;

        if (selectedAccount.isLocked) {
            dispatch(
                showRequestPasswordModal({
                    callback: (password: string) => {
                        dispatch(
                            unlockAccount({
                                address,
                                password
                            })
                        );
                    }
                })
            );
        } else {
            const account = accounts.find(
                a =>
                    a.address === address &&
                    (selectedAccount.isPrivateKey ? a.privateKey : !a.privateKey)
            );

            if (account) {
                dispatch(setActiveAccount(account));
            }
        }
    };

    const GUEST_ACCOUNT = {
        id: '0x0',
        isLocked: false,
        isPrivateKey: false,
        label: 'Guest',
        value: '0x0'
    };

    if (accounts.length === 0 || selectorAccounts.length === 0) {
        selectorAccounts.push(GUEST_ACCOUNT);

        if (!activeAccount) {
            activeAccount = {
                address: '0x0'
            };
        }
    }

    return (
        <div className="HeaderWrapper">
            <div className="Header">
                <NavLink to={getDevicesLink()}>
                    <img src={logo} />
                </NavLink>
                <ul className="NavMenu nav">
                    <li>
                        <NavLink to={getDevicesLink()}>Devices</NavLink>
                    </li>
                    <li>
                        <NavLink to={getCertificatesLink()}>Certificates</NavLink>
                    </li>
                    {!isIssuer && (
                        <li>
                            <NavLink to={getDemandsLink()} {...dataTest('header-link-demands')}>
                                Demands
                            </NavLink>
                        </li>
                    )}
                </ul>

                <div className="ViewProfile">
                    <Select
                        input={
                            <FilledInput
                                value={
                                    activeAccount
                                        ? `${activeAccount.address}${
                                              activeAccount.privateKey ? 'PK' : ''
                                          }`
                                        : ''
                                }
                            />
                        }
                        renderValue={(selected: string) => {
                            const accountToFind = selected || '0x0';

                            const selectedAccount = selectorAccounts.find(
                                a => a.id === accountToFind
                            );

                            return (
                                <>
                                    <AccountCircle className="ViewProfile_icon" color="primary" />
                                    {selectedAccount?.label}
                                    {isUsingPK && privateKeyIndicator}
                                </>
                            );
                        }}
                        startAdornment={<></>}
                        onChange={e => handleChange(e.target.value as string)}
                        disabled={selectorAccounts.length < 2}
                    >
                        {selectorAccounts.map(a => (
                            <MenuItem value={a.id} key={a.id}>
                                {a.label}
                                {a.isPrivateKey ? privateKeyIndicator : ' (MetaMask)'}
                                {a.isLocked && <Lock className={classes.icon} />}
                            </MenuItem>
                        ))}
                    </Select>
                    {!currentUser?.organization && (
                        <>
                            &nbsp;
                            <Link className={classes.endIcon} to={getUserRegisterLink()}>
                                <Tooltip title="Register user">
                                    <PersonAdd color="primary" />
                                </Tooltip>
                            </Link>
                        </>
                    )}
                    &nbsp;
                    <Link
                        to={getAccountLink()}
                        className={classes.endIcon}
                        {...dataTest('header-link-account-settings')}
                    >
                        <Tooltip title="Settings">
                            <Settings color="primary" />
                        </Tooltip>
                    </Link>
                </div>
            </div>
        </div>
    );
}
