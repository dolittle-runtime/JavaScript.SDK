// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ArtifactId, ArtifactsBuilder, Generation } from '../../index';

class FirstType {}

class SecondType {}

describe('when building with two associations', () => {
    const firstTypeIdentifier = ArtifactId.create('21ef6f8d-4871-48b0-9567-4d576b6a12da');
    const secondTypeIdentifier = ArtifactId.create('1c385ede-49ce-4266-a752-e1a85587758e');
    const firstTypeGeneration = Generation.create(42);
    const secondTypeGeneration = Generation.create(43);

    const builder = new ArtifactsBuilder();
    builder.associate(FirstType, firstTypeIdentifier, firstTypeGeneration);
    builder.associate(SecondType, secondTypeIdentifier, secondTypeGeneration);
    const result = builder.build();

    const firstTypeAssociation = result.getFor(FirstType);
    const secondTypeAssociation = result.getFor(SecondType);

    it('should return an instance', () => (result !== null || result !== undefined).should.be.true);
    it('should associate identifier for first type', () => firstTypeAssociation.id.should.equal(firstTypeIdentifier));
    it('should associate generation for first type', () => firstTypeAssociation.generation.should.equal(firstTypeGeneration));
    it('should associate identifier for second type', () => secondTypeAssociation.id.should.equal(secondTypeIdentifier));
    it('should associate generation for first type', () => secondTypeAssociation.generation.should.equal(secondTypeGeneration));
});
