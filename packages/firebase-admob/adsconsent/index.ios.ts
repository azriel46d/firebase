import { FirebaseError } from '@nativescript/firebase-core';
import { topViewController } from '../utils';
import { AdsConsentBase, AdsConsentDebugGeography, AdsConsentStatus } from './common';

export { AdsConsentStatus, AdsConsentDebugGeography };

export class AdsConsent extends AdsConsentBase {
	static #geography: AdsConsentDebugGeography;
	static #deviceIds: string[];
	static #tagForUnderAgeOfConsent: boolean;
	static #consentForm: UMPConsentForm;
	static reset() {
		UMPConsentInformation.sharedInstance.reset();
	}
	static addTestDevices(deviceIds: string[]) {
		this.#deviceIds = deviceIds;
	}
	static getStatus(): AdsConsentStatus {
		switch (UMPConsentInformation.sharedInstance.consentStatus) {
			case UMPConsentStatus.NotRequired:
				return AdsConsentStatus.NOT_REQUIRED;
			case UMPConsentStatus.Obtained:
				return AdsConsentStatus.OBTAINED;
			case UMPConsentStatus.Required:
				return AdsConsentStatus.REQUIRED;
			case UMPConsentStatus.Unknown:
				return AdsConsentStatus.UNKNOWN;
		}
	}
	static requestInfoUpdate(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = UMPRequestParameters.new();
			switch (this.#geography) {
				case AdsConsentDebugGeography.DISABLED:
					request.debugSettings.geography = UMPDebugGeography.Disabled;
					break;
				case AdsConsentDebugGeography.EEA:
					request.debugSettings.geography = UMPDebugGeography.EEA;
					break;
				case AdsConsentDebugGeography.NOT_EEA:
					request.debugSettings.geography = UMPDebugGeography.NotEEA;
					break;
			}

			if (Array.isArray(this.#deviceIds)) {
				request.debugSettings.testDeviceIdentifiers = this.#deviceIds.map((item) => {
					if (item === 'EMULATOR') {
						if(typeof kGADSimulatorID){
							return kGADSimulatorID;
						}
						return '';
					}
					return item;
				}) as any;
			}

			if (typeof this.#tagForUnderAgeOfConsent === 'boolean') {
				request.tagForUnderAgeOfConsent = this.#tagForUnderAgeOfConsent;
			}

			UMPConsentInformation.sharedInstance.requestConsentInfoUpdateWithParametersCompletionHandler(request, (error) => {
				if (error) {
					reject(FirebaseError.fromNative(error));
				} else {
					resolve();
				}
			});
		});
	}
	static setDebugGeography(geography: AdsConsentDebugGeography) {
		this.#geography = geography;
	}
	static setTagForUnderAgeOfConsent(tag: boolean) {
		this.#tagForUnderAgeOfConsent = tag;
	}

	static isConsentFormAvailable() {
		switch (UMPConsentInformation.sharedInstance.formStatus) {
			case UMPFormStatus.Available:
				return true;
			default:
				return false;
		}
	}

	static showForm(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.#consentForm.presentFromViewControllerCompletionHandler(topViewController(), (error) => {
				if (error) {
					reject(FirebaseError.fromNative(error));
				} else {
					resolve();
				}
			});
		});
	}
	static loadForm() {
		return new Promise<void>((resolve, reject) => {
			UMPConsentForm.loadWithCompletionHandler((form, error) => {
				if (error) {
					reject(FirebaseError.fromNative(error));
				} else {
					AdsConsent.#consentForm = form;
					resolve();
				}
			});
		});
	}
}
