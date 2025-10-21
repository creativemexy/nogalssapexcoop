import 'package:flutter/material.dart';

class Verify2FAScreen extends StatelessWidget {
  const Verify2FAScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify 2FA')),
      body: const Center(child: Text('Verify 2FA Screen')),
    );
  }
}