// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Exception that is thrown when an artifact is not possible to be resolved
 */
export class UnableToResolveArtifact extends Error {

    /**
     * Initializes a new instance of {UnknownEventType}
     * @param {Function} type Type of event that is unknown.
     * @param {*} [input] Optionally the input that was given
     */
    constructor(type: Function, input?: any) {
        let message = `'${type.name}' does not have an associated artifact identifier.`;
        if (input) {
            message = `${message}. Following input '${input}' was given in addition.`;
        }
        super(message);
    }
}