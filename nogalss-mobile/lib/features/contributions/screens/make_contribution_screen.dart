import 'package:flutter/material.dart';

class MakeContributionScreen extends StatelessWidget {
  const MakeContributionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Make Contribution')),
      body: const Center(child: Text('Make Contribution Screen')),
    );
  }
}